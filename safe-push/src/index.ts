import * as core from '@actions/core';
import * as github from '@actions/github';
import * as exec from '@actions/exec';
import * as io from '@actions/io';

const GIT_STATUS_CMD = ['status', '--porcelain'];
const GIT_ADD_CMD = ['add', '.'];
const GIT_COMMIT_CMD = ['commit', '-m'];
const GIT_PUSH_CMD = ['push'];
const GIT_PULL_CMD = ['pull'];
const MAX_ATTEMPTS = 3;

async function checkForChanges(gitPath: string): Promise<void> {
    let output = '';
    const options = {
        listeners: {
            stdout: (data: Buffer) => {
                output += data.toString();
            }
        }
    };

    await exec.exec(gitPath, GIT_STATUS_CMD, options);

    if (output.trim() === '') {
        core.info('No changes to commit');
        process.exit(0);
    }
}

async function run(): Promise<void> {
    try {
        // Get inputs
        const userName: string = core.getInput('user-name');
        const userEmail: string = core.getInput('user-email');
        const token: string = core.getInput('repo-token');
        const owner: string = core.getInput('owner');
        const repo: string = core.getInput('repository');
        const branch: string = core.getInput('branch') || 'main';
        const version: string = core.getInput('version');
        const sourceRepo: string | undefined = process.env.GITHUB_REPOSITORY;
        const commitMessage: string = core.getInput('commit-message') || `Publish version https://github.com/${sourceRepo}/commit/${version} to ${repo} repository`;
        const path: string = core.getInput('path') || '.';
        const octokit = github.getOctokit(token);

        const gitPath: string = await io.which('git', true);

        if (!repo.includes(owner)) {
            core.setFailed('Repository name must contain the owner name or owner must be specified');
            return;
        }

        // Change to the specified directory
        process.chdir(path);

        // Configure git
        await exec.exec(gitPath, ['config', '--global', 'user.name', userName]);
        await exec.exec(gitPath, ['config', '--global', 'user.email', userEmail]);

        // Stage changes
        await exec.exec(gitPath, GIT_ADD_CMD);

        // Check for changes
        await checkForChanges(gitPath);

        // Commit changes
        await exec.exec(gitPath, [...GIT_COMMIT_CMD, commitMessage]);

        // Push changes with retry logic
        let pushSuccess = false;
        let attempts = 0;

        while (!pushSuccess && attempts < MAX_ATTEMPTS) {
            try {
                await exec.exec(gitPath, [...GIT_PUSH_CMD, `https://${token}@github.com/${owner}/${repo}.git`, branch]);
                pushSuccess = true;
            } catch (error) {
                attempts++;
                if (attempts < MAX_ATTEMPTS) {
                    core.info(`Push failed, attempt ${attempts} of ${MAX_ATTEMPTS}. Trying to pull and retry...`);
                    await exec.exec(gitPath, [...GIT_PULL_CMD, `https://${token}@github.com/${owner}/${repo}.git`, branch]);
                } else {
                    throw error;
                }
            }
        }

        core.info('Changes pushed successfully');
    } catch (error) {
        core.setFailed(`Action failed with error: ${(error as Error).message}`);
    }
}

run();