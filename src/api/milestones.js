import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

const fetchPerPage = 30;

export const apiFetchMilestones = async (repository, accessToken, cancelToken) => {
    if (!repository) {
        throw new Error('Repository cannot be empty');
    }

    const repositoryName = repository.full_name || repository;

    const fetchData = async (currentPage) => {
        const payload = await axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/repos/${repositoryName}/milestones`,
            method: 'GET',
            params: {
                page: currentPage,
                per_page: fetchPerPage,
            },
        });

        return payload;
    }

    const results = [];
    let currentPage = 1;
    let keepGoing = true;

    while (keepGoing) {
        const response = await fetchData(currentPage);

        await results.push.apply(results, response.data.map(item => ({
            ...item, ...{
                repo: repositoryName,
            }
        })));

        if (response.data.length < fetchPerPage) {
            keepGoing = false;
            return results;
        }

        currentPage += 1;
    }
};

export const apiCreateMilestones = async (milestoneData, repository, accessToken, cancelToken) => {
    if (!milestoneData) {
        throw new Error('Milestone data cannot be empty');
    }

    if (!repository) {
        throw new Error('Repository cannot be empty');
    }

    const repositoryName = repository.full_name || repository;
    const milestones = Array.isArray(milestoneData) ? milestoneData : [milestoneData];

    const promises = [];

    milestones.forEach((milestone) => {
        promises.push(axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/repos/${repositoryName}/milestones`,
            method: 'POST',
            data: JSON.stringify(milestone),
        }));
    });

    const responses = await axios.all(promises);

    return responses.map(response => ({
        ...response.data, ...{
            repo: repositoryName,
        }
    }));
};

export const apiUpdateMilestones = async (milestoneData, repository, accessToken, cancelToken) => {
    if (!milestoneData) {
        throw new Error('Milestone data cannot be empty');
    }

    if (repository) {
        throw new Error('Repository cannot be empty');
    }

    const repositoryName = repository.full_name || repository;
    const milestones = Array.isArray(milestoneData) ? milestoneData : [milestoneData];

    const promises = [];

    milestones.forEach((milestone) => {
        promises.push(axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/repos/${repositoryName}/milestones/${milestone.number}`,
            method: 'PATCH',
            data: JSON.stringify(milestone),
        }));
    });

    const responses = await axios.all(promises);

    return responses.map(response => ({
        ...response.data, ...{
            repo: repositoryName,
        }
    }));
};