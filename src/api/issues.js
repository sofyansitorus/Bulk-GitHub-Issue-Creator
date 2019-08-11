import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

export const apiSearchIssues = async (requestParams, accessToken) => {
    const params = {
        page: 1,
        per_page: 10,
        ...requestParams,
    };

    const response = await axios({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${accessToken}`,
        },
        method: 'GET',
        url: '/search/issues',
        params,
    });

    return response;
};

export const apiCreateIssues = async (issueData, repository, accessToken) => {
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
            url: `/repos/${repository}/issues`,
            method: 'POST',
            data: JSON.stringify(issue),
        }));
    });

    const response = await axios.all(promises);

    return response;
};

export const apiUpdateIssues = async (issueData, repository, accessToken) => {
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
            url: `/repos/${repository}/issues/${issue.number}`,
            method: 'PATCH',
            data: JSON.stringify(issue),
        }));
    });

    const response = await axios.all(promises);

    return response;
};