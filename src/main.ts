import * as core from '@actions/core'
import * as github from '@actions/github'
import * as webhook from '@octokit/webhooks'
import translate from '@tomsun28/google-translate-api'
const franc = require('franc-min')

async function run(): Promise<void> {
  try {
    core.info(
      `2 receive github event name: ${github.context.eventName} action ${github.context.payload.action}`
    )
    let eventName = github.context.eventName
    let action = github.context.payload.action

    if (
      (eventName !== 'issue_comment' || action !== 'created') &&
      (eventName !== 'issues' || action !== 'opened') &&
      (eventName !== 'pull_request' || action !== 'opened') &&
      (eventName !== 'pull_request_target' || action !== 'opened')
    ) {
      core.info(
        `The status of the action must be created on issue or pull request, no applicable - ${github.context.payload.action} on ${github.context.eventName}, return`
      )
      return
    }

    let issueNumber = -1
    let originComment = ''
    let originTitle = null
    let issueUser = null
    let botNote =
      "Bot detected the issue body's language is not English, translate it automatically. 👯👭🏻🧑‍🤝‍🧑👫🧑🏿‍🤝‍🧑🏻👩🏾‍🤝‍👨🏿👬🏿"

    const isModifyTitle = core.getInput('IS_MODIFY_TITLE')
    let translateOrigin = ''
    let needCommitComment = true
    let needCommitTitle = true

    if (eventName === 'issue_comment') {
      // new issue comment
      const issueCommentPayload = github.context
        .payload as webhook.EventPayloads.WebhookPayloadIssueComment

      issueNumber = issueCommentPayload.issue.number
      issueUser = issueCommentPayload.comment.user.login
      originComment = issueCommentPayload.comment.body
      core.info(`issue comment user is: ${issueUser}`)

      if (originComment === null || originComment === 'null') {
        needCommitComment = false
      }
      needCommitTitle = false
    } else if (eventName === 'issues') {
      // new issue
      const issuePayload = github.context
        .payload as webhook.EventPayloads.WebhookPayloadIssues

      issueNumber = issuePayload.issue.number
      issueUser = issuePayload.issue.user.login
      originComment = issuePayload.issue.body

      if (originComment === null || originComment === 'null') {
        needCommitComment = false
      }

      originTitle = issuePayload.issue.title
      if (originTitle === null || originTitle === 'null') {
        needCommitTitle = false
      }
    } else if (
      eventName === 'pull_request' ||
      eventName === 'pull_request_target'
    ) {
      // new pull request

      const pullRequestPayload = github.context
        .payload as webhook.EventPayloads.WebhookPayloadPullRequest
      issueNumber = pullRequestPayload.number
      originTitle = pullRequestPayload.pull_request.title
      originComment = pullRequestPayload.pull_request.body
    }

    // detect issue title comment body is english
    if (originComment !== null && detectIsEnglish(originComment)) {
      needCommitComment = false
      core.info('Detect the issue comment body is english already, ignore.')
    }

    if (originTitle !== null && detectIsEnglish(originTitle)) {
      needCommitTitle = false
      core.info('Detect the issue title body is english already, ignore.')
    }

    if (!needCommitTitle && !needCommitComment) {
      core.info('Detect the issue do not need translated, return.')
      return
    }

    if (needCommitComment && needCommitTitle) {
      translateOrigin = `${originComment}@@====${originTitle}`
    } else if (needCommitComment) {
      translateOrigin = originComment
    } else {
      translateOrigin = `null@@====${originTitle}`
    }

    let botToken = core.getInput('BOT_GITHUB_TOKEN')
    let octokit = null

    // ignore when bot comment issue himself
    let botLoginName = core.getInput('BOT_LOGIN_NAME')

    core.info(`get github token and login name. login name is: ${botLoginName}`)

    // support custom bot note message
    const customBotMessage = core.getInput('CUSTOM_BOT_NOTE')
    if (customBotMessage !== null && customBotMessage.trim() !== '') {
      botNote = customBotMessage
    }

    if (
      botLoginName === null ||
      botLoginName === undefined ||
      botLoginName === ''
    ) {
      octokit = github.getOctokit(botToken)
      core.info('hnwyllmm: before get the user of token')
      try {
        const botInfo = await octokit.request('GET /user')
        botLoginName = botInfo.data.login
        core.debug(`hnwyllmm: the user of the token is ${botInfo}`)
      } catch (error: any) {
        core.info(`cannot get the user of the token. ${error.message}`)
      }
    }
    if (botLoginName === issueUser) {
      core.info(
        `The issue comment user is bot ${botLoginName} himself, ignore return.`
      )
      return
    }

    core.info(`hnwyllmm translate origin body is: ${translateOrigin}`)

    // translate issue comment body to english
    const translateTmp = await translateIssueOrigin(translateOrigin)

    if (
      translateTmp === null ||
      translateTmp === '' ||
      translateTmp === translateOrigin
    ) {
      core.warning('The translateBody is null or same, ignore return.')
      return
    }

    const translateBody: string[] = translateTmp.split('@@====')
    let translateComment = null
    let translateTitle = null

    core.info(`translate body is: ${translateTmp}`)

    if (translateBody.length == 1) {
      translateComment = translateBody[0].trim()
      if (translateComment === originComment) {
        needCommitComment = false
      }
    } else if (translateBody.length == 2) {
      translateComment = translateBody[0].trim()
      translateTitle = translateBody[1].trim()
      if (translateComment === originComment) {
        needCommitComment = false
      }
      if (translateTitle === originTitle) {
        needCommitTitle = false
      }
    } else {
      core.setFailed(`the translateBody is ${translateTmp}`)
    }

    // create comment by bot
    if (octokit === null) {
      octokit = github.getOctokit(botToken)
    }
    if (isModifyTitle === 'false' && needCommitTitle && needCommitComment) {
      translateComment = ` 
> ${botNote}      
----  
**Title:** ${translateTitle}    

${translateComment}  
      `
    } else if (
      isModifyTitle === 'false' &&
      needCommitTitle &&
      !needCommitComment
    ) {
      translateComment = ` 
> ${botNote}      
----  
**Title:** ${translateTitle}    
      `
    } else if (needCommitComment) {
      translateComment = ` 
> ${botNote}         
----    
${translateComment}  
      `
    } else {
      translateComment = null
    }

    if (isModifyTitle === 'true' && translateTitle != null && needCommitTitle) {
      await modifyTitle(issueNumber, translateTitle, octokit)
    }

    if (translateComment !== null) {
      await createComment(issueNumber, translateComment, octokit)
    }
    core.setOutput('complete time', new Date().toTimeString())
  } catch (error: any) {
    core.setFailed(`Catch exception: ${error.message}`)
  }
}

function detectIsEnglish(body: string | null): boolean | true {
  if (body === null) {
    return true
  }
  const detectResult = franc(body)
  if (
    detectResult === 'und' ||
    detectResult === undefined ||
    detectResult === null
  ) {
    core.warning(`Can not detect the undetermined comment body: ${body}`)
    return false
  }
  core.info(`Detect comment body language result is: ${detectResult}`)
  return detectResult === 'eng'
}

async function translateIssueOrigin(body: string): Promise<string> {
  let result = ''
  await translate(body, {to: 'en'})
    .then(res => {
      if (res.text !== body) {
        result = res.text
      }
    })
    .catch(err => {
      core.error(err)
      core.setFailed(err.message)
    })
  return result
}

async function createComment(
  issueNumber: number,
  body: string | null,
  octokit: any
): Promise<void> {
  const {owner, repo} = github.context.repo
  const issue_url = github.context.payload.issue?.html_url
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body
  })
  core.info(
    `complete to push translate issue comment: ${body} in ${issue_url} `
  )
}

async function modifyTitle(
  issueNumber: number,
  title: string | null,
  octokit: any
): Promise<void> {
  const {owner, repo} = github.context.repo
  const issue_url = github.context.payload.issue?.html_url
  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    title
  })
  core.info(
    `complete to modify translate issue title: ${title} in ${issue_url} `
  )
}

run()
