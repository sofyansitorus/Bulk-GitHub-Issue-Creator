import store from 'storejs';

import {
    assign,
    concat,
    forEach,
    get,
    has,
    isArray,
    isObject,
    isUndefined,
    keys,
    sortBy,
    isString,
} from 'lodash';

/**
 * The CustomEvent interface polyfill
 */
(() => {
    if (typeof window.CustomEvent === "function") {
        return false;
    }

    function CustomEvent(event, params) {
        const eventParams = assign({}, {
            bubbles: false,
            cancelable: false,
            detail: null
        }, params);

        var evt = document.createEvent('CustomEvent');

        evt.initCustomEvent(event, eventParams.bubbles, eventParams.cancelable, eventParams.detail);

        return evt;
    }

    window.CustomEvent = CustomEvent;
})();

/**
 * Generate dot concated data key
 * 
 * @param {string} baseKey 
 * @param {object} data 
 * @param {array} dataProperty
 * 
 * @return {string}
 */
const keyDataGenerator = (baseKey, data, dataProperty = ['id']) => {
    if (isUndefined(data)) {
        return `${baseKey}`;
    }

    if (!isObject(data)) {
        return `${baseKey}.${data}`;
    }

    return `${concat([baseKey], dataProperty.map(property => get(data, property, ''))).join('.')}`;
}

const dispatchStorageChangeEvent = (eventDetail) => {
    const storageChangeEvent = new CustomEvent('storageChange', {
        detail: eventDetail,
    });

    window.dispatchEvent(storageChangeEvent);
};

export const setData = (key, value, eventData) => {
    if (isObject(key)) {
        store.set(key);

        dispatchStorageChangeEvent(assign({}, {
            action: 'setData',
            data: key,
        }, eventData));
    } else {
        store.set(key, value);

        dispatchStorageChangeEvent(assign({}, {
            action: 'setData',
            data: {
                [key]: value,
            }
        }, eventData));
    }
};

export const removeData = (key, eventData) => {
    if (isArray(key)) {
        forEach(key, removeKey => {
            store.remove(removeKey);
        });
    } else if (isObject(key)) {
        forEach(keys(key), removeKey => {
            store.remove(removeKey);
        });
    } else {
        store.remove(key);
    }

    dispatchStorageChangeEvent(assign({}, {
        action: 'removeData',
        data: key,
    }, eventData));
};

export const clearData = (eventData) => {
    store.clear();

    dispatchStorageChangeEvent(assign({}, {
        action: 'clearData',
    }, eventData));
};


export const getData = (keys) => isArray(keys) ? keys.map(key => store.get(key)) : store.get(keys);

/**
 * Authentication Data Helpers
 */
export const setAuthentication = (accessToken, currentUser) => setData('authentication', { accessToken, currentUser }, {
    entity: 'authentication',
    method: 'set',
});

export const removeAuthentication = () => removeData('authentication', {
    entity: 'authentication',
    method: 'remove',
});

export const getAuthentication = () => getData('authentication');

/**
 * Owner Data Helpers
 */
export const keyDataOwner = (owner) => {
    return keyDataGenerator('owner', owner);
};


export const getDataOwners = () => {
    const owners = getData(store.keys().filter(key => key.indexOf(keyDataOwner('')) === 0));

    return sortBy(owners, ['login']);
};

export const setDataOwners = (owners) => {
    const data = {};

    forEach(owners, (owner) => {
        data[keyDataOwner(owner)] = owner;
    });

    setData(data, undefined, {
        entity: 'owner',
    });
};

/**
 * Repository Data Helpers
 */
export const keyDataRepository = (repository) => {
    return keyDataGenerator('repository', repository);
};

export const getDataRepositories = (owner) => {
    const items = getData(store.keys().filter(key => key.indexOf(keyDataRepository('')) === 0));

    if (owner) {
        return sortBy(items.filter(item => item.owner.login === owner), ['name']);
    }

    return sortBy(items, ['name']);
};

export const setDataRepositories = (repositories) => {
    const data = {};

    forEach(repositories, (repository) => {
        data[keyDataRepository(repository)] = repository;
    });

    setData(data, undefined, {
        entity: 'repository',
    });
};

/**
 * Imported Issue Data Helpers
 */
export const keyDataImportedIssue = (issue) => {
    return keyDataGenerator('issue_imported', issue);
};

export const getDataImportedIssue = (issue) => getData(keyDataImportedIssue(issue));

export const getDataImportedIssues = () => getData(store.keys().filter(key => key.indexOf(keyDataImportedIssue('')) === 0));

export const removeDataImportedIssue = (issue) => removeData(keyDataImportedIssue(issue), {
    entity: 'issue_imported',
});

export const removeDataImportedIssues = () => removeData(store.keys().filter(key => key.indexOf(keyDataImportedIssue('')) === 0), {
    entity: 'issue_imported',
});

export const setDataImportedIssue = (issue) => setData(keyDataImportedIssue(issue), issue, {
    entity: 'issue_imported',
});

export const setDataImportedIssues = (issues) => {
    const data = {};

    forEach(issues, (issue) => {
        data[keyDataImportedIssue(issue)] = issue;
    });

    setData(data, undefined, {
        entity: 'issue_imported',
    });
};

/**
 * Created Issue Data Helpers
 */
export const keyDataCreatedIssue = (issue) => {
    return keyDataGenerator('issue_created', issue);
};


/**
 * Assignee Data Helpers
 */
export const keyDataAssignee = (assignee) => {
    return keyDataGenerator('assignee', assignee, ['org', 'id']);
};

export const getDataAssignees = (org) => {
    const items = getData(store.keys().filter(key => key.indexOf(keyDataAssignee('')) === 0));

    if (org) {
        return sortBy(items.filter(item => item.org === org), ['login']);
    }

    return sortBy(items, ['login']);
};

export const setDataAssignees = (assignees) => {
    const data = {};

    forEach(assignees, (assignee) => {
        data[keyDataAssignee(assignee)] = assignee;
    });

    setData(data, undefined, {
        entity: 'assignee',
    });
};

/**
 * Label Data Helpers
 */
export const keyDataLabel = (label) => {
    return keyDataGenerator('label', label);
};

export const getDataLabels = (repo) => {
    const items = getData(store.keys().filter(key => key.indexOf(keyDataLabel('')) === 0));

    if (repo) {
        return sortBy(items.filter(item => item.url.indexOf(repo) !== -1), ['name']);
    }

    return sortBy(items, ['name']);
};

export const setDataLabels = (labels) => {
    const data = {};

    forEach(labels, (label) => {
        data[keyDataLabel(label)] = label;
    });

    setData(data, undefined, {
        entity: 'label',
    });
};

/**
 * Milestone Data Helpers
 */
export const keyDataMilestone = (milestone) => {
    return keyDataGenerator('milestone', milestone);
};

export const getDataMilestones = (repo) => {
    const items = getData(store.keys().filter(key => key.indexOf(keyDataMilestone('')) === 0));

    if (repo) {
        return sortBy(items.filter(item => item.url.indexOf(repo) !== -1), ['title']);
    }

    return sortBy(items, ['title']);
};

export const setDataMilestones = (milestones) => {
    const data = {};

    forEach(milestones, (milestone) => {
        data[keyDataMilestone(milestone)] = milestone;
    });

    setData(data, undefined, {
        entity: 'milestone',
    });
};

/**
 * Alert Data Helpers
 */
const keyAlert = (name) => {
    return keyDataGenerator('alert', name);
};

const getAlertMessage = (alert) => {
    if (has(alert, 'response.data.message') && has(alert, 'response.data.errors')) {
        return `${alert.response.data.message}: ${JSON.stringify(alert.response.data.errors)}`;
    } else if (has(alert, 'response.data.message')) {
        return alert.response.data.message;
    } else if (has(alert, 'response.message')) {
        return alert.response.message;
    } else if (has(alert, 'message')) {
        return alert.message;
    } else {
        return alert.toString();
    }
};

const populateAlertData = (variant, id, alert, name = 'form') => {
    const alertDefault = {
        variant,
        id,
        name,
        linkUrl: false,
        linkAnchor: false,
        message: getAlertMessage(alert),
    };

    if (isString(alert)) {
        return alertDefault;
    };

    return assign({}, alertDefault, alert);
};

export const setAlert = (alert, name = 'form') => setData(keyAlert(name), alert, {
    entity: 'alert',
});

export const setAlertSuccess = (alert, name = 'form') => {
    const alerts = isArray(alert) ? alert : [alert];

    setAlert(alerts.map((alert, index) => populateAlertData('info', index, alert, name)), name);
};

export const setAlertError = (alert, name = 'form') => {
    const alerts = isArray(alert) ? alert : [alert];

    setAlert(alerts.map((alert, index) => populateAlertData('danger', index, alert, name)), name);
};

export const getAlert = (name = 'form') => {
    return getData(keyAlert(name));
};

export const clearAlert = (name = 'form') => removeData(keyAlert(name), {
    entity: 'alert',
});

/**
 * Loading State Data Helpers
 */
const keyLoadingState = (name) => {
    return keyDataGenerator('loadingState', name);
};

export const isLoading = (name = 'form') => {
    return getData(keyLoadingState(name));
};

export const startLoading = (name = 'form') => setData(keyLoadingState(name), true, {
    entity: 'loadingState',
});

export const stopLoading = (name = 'form') => setData(keyLoadingState(name), false, {
    entity: 'loadingState',
});

export const getDataFetchedStatus = (group) => getData(keyDataGenerator('dataFetched', group));

export const setDataFetchedStatus = (group, status) => setData(keyDataGenerator('dataFetched', group), status);