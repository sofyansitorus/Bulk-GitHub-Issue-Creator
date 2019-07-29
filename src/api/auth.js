import axios from 'axios';

axios.defaults.baseURL = 'https://api.github.com';

export const apiAuth = async (accessToken, cancelToken) => {
    if (!accessToken) {
        throw new Error('Access token cannot be empty');
    }

    const response = await axios({
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `token ${accessToken}`,
        },
        cancelToken: cancelToken,
        url: '/user',
        method: 'GET',
    });

    return response;
};