import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

const fetchPerPage = 30;

export const apiFetchLabels = async (repository, accessToken, cancelToken) => {
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
            url: `/repos/${repositoryName}/labels`,
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

        await results.push(...response.data);

        if (response.data.length < fetchPerPage) {
            keepGoing = false;
            return results;
        }

        currentPage += 1;
    }
};

export const apiCreateLabels = async (labelData, repository, accessToken, cancelToken) => {
    if (!labelData) {
        throw new Error('Label data cannot be empty');
    }

    if (!repository) {
        throw new Error('Repository cannot be empty');
    }

    const labels = Array.isArray(labelData) ? labelData : [labelData];

    const promises = [];

    labels.forEach((label) => {
        promises.push(axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/repos/${repository.full_name}/labels`,
            method: 'POST',
            data: JSON.stringify(label),
        }));
    });

    const responses = await axios.all(promises);

    return responses.map(response => response.data);
};