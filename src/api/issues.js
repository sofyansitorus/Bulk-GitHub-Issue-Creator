import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

export const apiCreateIssues = async (issueData, repository, accessToken, cancelToken) => {
    const errors = [];

    if (!repository) {
        errors.push('Repository must not be empty');
    }

    const issues = Array.isArray(issueData) ? issueData : [issueData];

    if (!issues.length) {
        errors.push('No issue entries');
    } else {
        if (issues.filter(issue => !issue.title).length) {
            errors.push('Issue title must not be empty');
        }

        if (issues.filter(issue => !issue.body).length) {
            errors.push('Issue body must not be empty');
        }
    }

    if (errors.length) {
        throw errors;
    }

    const promises = [];

    issues.forEach((issue) => {
        promises.push(axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/repos/${repository}/issues`,
            method: 'POST',
            data: JSON.stringify(issue),
        }));
    });

    const response = await axios.all(promises);

    return response;
};

export const apiUpdateIssues = async (issueData, repository, accessToken, cancelToken) => {
    if (!issueData) {
        throw new Error('Issue data cannot be empty');
    }

    if (!repository) {
        throw new Error('Repository cannot be empty');
    }

    const response = await axios({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${accessToken}`,
        },
        cancelToken: cancelToken,
        url: `/repos/${repository}/issues/${issueData.number}`,
        method: 'PATCH',
        data: JSON.stringify(issueData),
    });

    return response;
};