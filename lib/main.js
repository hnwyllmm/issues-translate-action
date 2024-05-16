"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const google_translate_api_1 = __importDefault(require("@tomsun28/google-translate-api"));
const franc = require('franc-min');
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            core.info(`2 receive github event name: ${github.context.eventName} action ${github.context.payload.action}`);
            if ((github.context.eventName !== 'issue_comment' ||
                github.context.payload.action !== 'created') &&
                (github.context.eventName !== 'issues' ||
                    github.context.payload.action !== 'opened')) {
                core.info(`The status of the action must be created on issue_comment, no applicable - ${github.context.payload.action} on ${github.context.eventName}, return`);
                return;
            }
            core.info('version 2');
            let issueNumber = null;
            let originComment = null;
            let originTitle = null;
            let issueUser = null;
            let botNote = "Bot detected the issue body's language is not English, translate it automatically. 👯👭🏻🧑‍🤝‍🧑👫🧑🏿‍🤝‍🧑🏻👩🏾‍🤝‍👨🏿👬🏿";
            const isModifyTitle = core.getInput('IS_MODIFY_TITLE');
            let translateOrigin = null;
            let needCommitComment = true;
            let needCommitTitle = true;
            if (github.context.eventName === 'issue_comment') {
                const issueCommentPayload = github.context.payload;
                issueNumber = issueCommentPayload.issue.number;
                issueUser = issueCommentPayload.comment.user.login;
                originComment = issueCommentPayload.comment.body;
                if (originComment === null || originComment === 'null') {
                    needCommitComment = false;
                }
                needCommitTitle = false;
            }
            else {
                const issuePayload = github.context.payload;
                issueNumber = issuePayload.issue.number;
                issueUser = issuePayload.issue.user.login;
                originComment = issuePayload.issue.body;
                if (originComment === null || originComment === 'null') {
                    needCommitComment = false;
                }
                originTitle = issuePayload.issue.title;
                if (originTitle === null || originTitle === 'null') {
                    needCommitTitle = false;
                }
            }
            // detect issue title comment body is english
            if (originComment !== null && detectIsEnglish(originComment)) {
                needCommitComment = false;
                core.info('Detect the issue comment body is english already, ignore.');
            }
            if (originTitle !== null && detectIsEnglish(originTitle)) {
                needCommitTitle = false;
                core.info('Detect the issue title body is english already, ignore.');
            }
            if (!needCommitTitle && !needCommitComment) {
                core.info('Detect the issue do not need translated, return.');
                return;
            }
            if (needCommitComment && needCommitTitle) {
                translateOrigin = `${originComment}@@====${originTitle}`;
            }
            else if (needCommitComment) {
                translateOrigin = originComment;
            }
            else {
                translateOrigin = `null@@====${originTitle}`;
            }
            let botToken = core.getInput('token');
            let octokit = github.getOctokit(botToken);
            /*
            // ignore when bot comment issue himself
            let botToken = core.getInput('BOT_GITHUB_TOKEN')
            let botLoginName = core.getInput('BOT_LOGIN_NAME')
            if (botToken === null || botToken === undefined || botToken === '') {
              // use the default github bot token
              const defaultBotTokenBase64 =
                'Y2I4M2EyNjE0NThlMzIwMjA3MGJhODRlY2I5NTM0ZjBmYTEwM2ZlNg=='
              const defaultBotLoginName = 'Issues-translate-bot'
              botToken = Buffer.from(defaultBotTokenBase64, 'base64').toString()
              botLoginName = defaultBotLoginName
            }
            core.info('hnwyllmm: get github token and login name')
        
            // support custom bot note message
            const customBotMessage = core.getInput('CUSTOM_BOT_NOTE')
            if (customBotMessage !== null && customBotMessage.trim() !== '') {
              botNote = customBotMessage
            }
        
            let octokit = null
            if (
              botLoginName === null ||
              botLoginName === undefined ||
              botLoginName === ''
            ) {
              octokit = github.getOctokit(botToken)
              core.info('hnwyllmm: before get the user of token')
              const botInfo = await octokit.request('GET /user')
              botLoginName = botInfo.data.login
              core.debug(`hnwyllmm: the user of the token is ${botInfo}`)
            }
            if (botLoginName === issueUser) {
              core.info(
                `The issue comment user is bot ${botLoginName} himself, ignore return.`
              )
              return
            }
            */
            core.info(`hnwyllmm translate origin body is: ${translateOrigin}`);
            // translate issue comment body to english
            const translateTmp = yield translateIssueOrigin(translateOrigin);
            if (translateTmp === null ||
                translateTmp === '' ||
                translateTmp === translateOrigin) {
                core.warning('The translateBody is null or same, ignore return.');
                return;
            }
            const translateBody = translateTmp.split('@@====');
            let translateComment = null;
            let translateTitle = null;
            core.info(`translate body is: ${translateTmp}`);
            if (translateBody.length == 1) {
                translateComment = translateBody[0].trim();
                if (translateComment === originComment) {
                    needCommitComment = false;
                }
            }
            else if (translateBody.length == 2) {
                translateComment = translateBody[0].trim();
                translateTitle = translateBody[1].trim();
                if (translateComment === originComment) {
                    needCommitComment = false;
                }
                if (translateTitle === originTitle) {
                    needCommitTitle = false;
                }
            }
            else {
                core.setFailed(`the translateBody is ${translateTmp}`);
            }
            // create comment by bot
            // if (octokit === null) {
            //   octokit = github.getOctokit(botToken)
            // }
            if (isModifyTitle === 'false' && needCommitTitle && needCommitComment) {
                translateComment = ` 
> ${botNote}      
----  
**Title:** ${translateTitle}    

${translateComment}  
      `;
            }
            else if (isModifyTitle === 'false' &&
                needCommitTitle &&
                !needCommitComment) {
                translateComment = ` 
> ${botNote}      
----  
**Title:** ${translateTitle}    
      `;
            }
            else if (needCommitComment) {
                translateComment = ` 
> ${botNote}         
----    
${translateComment}  
      `;
            }
            else {
                translateComment = null;
            }
            if (isModifyTitle === 'true' && translateTitle != null && needCommitTitle) {
                yield modifyTitle(issueNumber, translateTitle, octokit);
            }
            if (translateComment !== null) {
                yield createComment(issueNumber, translateComment, octokit);
            }
            core.setOutput('complete time', new Date().toTimeString());
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
function detectIsEnglish(body) {
    if (body === null) {
        return true;
    }
    const detectResult = franc(body);
    if (detectResult === 'und' ||
        detectResult === undefined ||
        detectResult === null) {
        core.warning(`Can not detect the undetermined comment body: ${body}`);
        return false;
    }
    core.info(`Detect comment body language result is: ${detectResult}`);
    return detectResult === 'eng';
}
function translateIssueOrigin(body) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = '';
        yield (0, google_translate_api_1.default)(body, { to: 'en' })
            .then(res => {
            if (res.text !== body) {
                result = res.text;
            }
        })
            .catch(err => {
            core.error(err);
            core.setFailed(err.message);
        });
        return result;
    });
}
function createComment(issueNumber, body, octokit) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { owner, repo } = github.context.repo;
        const issue_url = (_a = github.context.payload.issue) === null || _a === void 0 ? void 0 : _a.html_url;
        yield octokit.issues.createComment({
            owner,
            repo,
            issue_number: issueNumber,
            body
        });
        core.info(`complete to push translate issue comment: ${body} in ${issue_url} `);
    });
}
function modifyTitle(issueNumber, title, octokit) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const { owner, repo } = github.context.repo;
        const issue_url = (_a = github.context.payload.issue) === null || _a === void 0 ? void 0 : _a.html_url;
        yield octokit.issues.update({
            owner,
            repo,
            issue_number: issueNumber,
            title
        });
        core.info(`complete to modify translate issue title: ${title} in ${issue_url} `);
    });
}
run();
