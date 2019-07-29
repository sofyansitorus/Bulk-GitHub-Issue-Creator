import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

const fetchPerPage = 30;

export const apiFetchOwners = async (accessToken, cancelToken) => {
    const fetchData = async (currentPage) => {
        const payload = await axios({
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `token ${accessToken}`,
            },
            cancelToken: cancelToken,
            url: '/user/orgs',
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

        await records.push(...response.data.map(item => ({ ...item, ...{ type: 'org' } })));

        currentPage += 1;

        if (response.data.length < fetchPerPage) {
            keepGoing = false;
            return records;
        }
    }
};