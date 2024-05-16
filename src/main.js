"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("@actions/core");
var Octokit = require('@octokit/rest').Octokit;
var github = require("@actions/github");
var google_translate_api_1 = require("@tomsun28/google-translate-api");
var franc = require('franc-min');
var octokit = new Octokit({ auth: "token ".concat(github.token) });
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var issueNumber, originComment, originTitle, issueUser, botNote, isModifyTitle, translateOrigin, needCommitComment, needCommitTitle, issueCommentPayload, issuePayload, translateTmp, translateBody, translateComment, translateTitle, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 6, , 7]);
                    octokit.issues.update({
                        owner: 'hnwyllmm',
                        repo: 'snip',
                        issue_number: 27,
                        title: 'test update title',
                    });
                    if ((github.context.eventName !== 'issue_comment' ||
                        github.context.payload.action !== 'created') &&
                        (github.context.eventName !== 'issues' ||
                            github.context.payload.action !== 'opened')) {
                        core.info("The status of the action must be created on issue_comment, no applicable - ".concat(github.context.payload.action, " on ").concat(github.context.eventName, ", return"));
                        return [2 /*return*/];
                    }
                    core.info('version 2');
                    issueNumber = null;
                    originComment = null;
                    originTitle = null;
                    issueUser = null;
                    botNote = "Bot detected the issue body's language is not English, translate it automatically. 👯👭🏻🧑‍🤝‍🧑👫🧑🏿‍🤝‍🧑🏻👩🏾‍🤝‍👨🏿👬🏿";
                    isModifyTitle = core.getInput('IS_MODIFY_TITLE');
                    translateOrigin = null;
                    needCommitComment = true;
                    needCommitTitle = true;
                    if (github.context.eventName === 'issue_comment') {
                        issueCommentPayload = github.context.payload;
                        issueNumber = issueCommentPayload.issue.number;
                        issueUser = issueCommentPayload.comment.user.login;
                        originComment = issueCommentPayload.comment.body;
                        if (originComment === null || originComment === 'null') {
                            needCommitComment = false;
                        }
                        needCommitTitle = false;
                    }
                    else {
                        issuePayload = github.context.payload;
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
                        return [2 /*return*/];
                    }
                    if (needCommitComment && needCommitTitle) {
                        translateOrigin = "".concat(originComment, "@@====").concat(originTitle);
                    }
                    else if (needCommitComment) {
                        translateOrigin = originComment;
                    }
                    else {
                        translateOrigin = "null@@====".concat(originTitle);
                    }
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
                    core.info("translate origin body is: ".concat(translateOrigin));
                    return [4 /*yield*/, translateIssueOrigin(translateOrigin)];
                case 1:
                    translateTmp = _a.sent();
                    if (translateTmp === null ||
                        translateTmp === '' ||
                        translateTmp === translateOrigin) {
                        core.warning('The translateBody is null or same, ignore return.');
                        return [2 /*return*/];
                    }
                    translateBody = translateTmp.split('@@====');
                    translateComment = null;
                    translateTitle = null;
                    core.info("translate body is: ".concat(translateTmp));
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
                        core.setFailed("the translateBody is ".concat(translateTmp));
                    }
                    // create comment by bot
                    // if (octokit === null) {
                    //   octokit = github.getOctokit(botToken)
                    // }
                    if (isModifyTitle === 'false' && needCommitTitle && needCommitComment) {
                        translateComment = " \n> ".concat(botNote, "      \n----  \n**Title:** ").concat(translateTitle, "    \n\n").concat(translateComment, "  \n      ");
                    }
                    else if (isModifyTitle === 'false' &&
                        needCommitTitle &&
                        !needCommitComment) {
                        translateComment = " \n> ".concat(botNote, "      \n----  \n**Title:** ").concat(translateTitle, "    \n      ");
                    }
                    else if (needCommitComment) {
                        translateComment = " \n> ".concat(botNote, "         \n----    \n").concat(translateComment, "  \n      ");
                    }
                    else {
                        translateComment = null;
                    }
                    if (!(isModifyTitle === 'true' && translateTitle != null && needCommitTitle)) return [3 /*break*/, 3];
                    return [4 /*yield*/, modifyTitle(issueNumber, translateTitle, octokit)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    if (!(translateComment !== null)) return [3 /*break*/, 5];
                    return [4 /*yield*/, createComment(issueNumber, translateComment, octokit)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    core.setOutput('complete time', new Date().toTimeString());
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function detectIsEnglish(body) {
    if (body === null) {
        return true;
    }
    var detectResult = franc(body);
    if (detectResult === 'und' ||
        detectResult === undefined ||
        detectResult === null) {
        core.warning("Can not detect the undetermined comment body: ".concat(body));
        return false;
    }
    core.info("Detect comment body language result is: ".concat(detectResult));
    return detectResult === 'eng';
}
function translateIssueOrigin(body) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = '';
                    return [4 /*yield*/, (0, google_translate_api_1.default)(body, { to: 'en' })
                            .then(function (res) {
                            if (res.text !== body) {
                                result = res.text;
                            }
                        })
                            .catch(function (err) {
                            core.error(err);
                            core.setFailed(err.message);
                        })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, result];
            }
        });
    });
}
function createComment(issueNumber, body, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, owner, repo, issue_url;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = github.context.repo, owner = _a.owner, repo = _a.repo;
                    issue_url = (_b = github.context.payload.issue) === null || _b === void 0 ? void 0 : _b.html_url;
                    return [4 /*yield*/, octokit.issues.createComment({
                            owner: owner,
                            repo: repo,
                            issue_number: issueNumber,
                            body: body
                        })];
                case 1:
                    _c.sent();
                    core.info("complete to push translate issue comment: ".concat(body, " in ").concat(issue_url, " "));
                    return [2 /*return*/];
            }
        });
    });
}
function modifyTitle(issueNumber, title, octokit) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, owner, repo, issue_url;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _a = github.context.repo, owner = _a.owner, repo = _a.repo;
                    issue_url = (_b = github.context.payload.issue) === null || _b === void 0 ? void 0 : _b.html_url;
                    return [4 /*yield*/, octokit.issues.update({
                            owner: owner,
                            repo: repo,
                            issue_number: issueNumber,
                            title: title
                        })];
                case 1:
                    _c.sent();
                    core.info("complete to modify translate issue title: ".concat(title, " in ").concat(issue_url, " "));
                    return [2 /*return*/];
            }
        });
    });
}
run();
