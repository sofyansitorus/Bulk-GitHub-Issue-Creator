import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

const fetchPerPage = 30;

export const apiFetchAssignees = async (org, accessToken, cancelToken) => {
    if (!org) {
        throw new Error('Organization cannot be empty');
    }

    const fetchData = async (currentPage) => {
        const payload = await axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: `/orgs/${org.login}/members`,
            method: 'GET',
            params: {
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

        await records.push(...response.data.map(item => ({
            ...item,
            ...{
                org: org.login,
            }
        })));

        if (response.data.length < fetchPerPage) {
            keepGoing = false;
            return records;
        }

        currentPage += 1;
    }
};