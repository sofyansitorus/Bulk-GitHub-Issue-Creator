import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

const fetchPerPage = 30;

export const apiFetchRepsitories = async (org, accessToken, cancelToken) => {
    if (!org) {
        throw new Error('User or Organization cannot be empty');
    }

    const fetchData = async (currentPage) => {
        const payload = await axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: '/search/repositories',
            method: 'GET',
            params: {
                q: `${org.type}:${org.login}`,
                page: currentPage,
                per_page: fetchPerPage,
            },
        });

        return payload;
    }

    const records = [];
    let currentPage = 1;
    let keepGoing = true;

    while (keepGoing) {
        const response = await fetchData(currentPage);

        await records.push(...response.data.items);

        if (records.length >= response.data.total_count) {
            keepGoing = false;
            return records;
        }

        currentPage += 1;
    }
};