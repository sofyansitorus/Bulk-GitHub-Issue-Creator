import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import LoadingOverlay from 'react-loading-overlay';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
    faEdit,
    faLink,
    faTrash,
} from '@fortawesome/free-solid-svg-icons';

import {
    Button,
    ButtonGroup,
    Dropdown,
    DropdownButton,
    FormControl,
    InputGroup,
    OverlayTrigger,
    Pagination,
    Table,
    Tooltip,
} from 'react-bootstrap';

import {
    assign,
    debounce,
    get,
    has,
    isEmpty,
    isEqual,
    noop,
} from 'lodash';

class BGICIssueList extends PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            isTypingKeyword: false,
            filterParams: props.filterParams,
        };

        this.onChangeFilterParams = this.onChangeFilterParams.bind(this);
        this.onChangeFilterParamsDebounced = debounce(this.props.onChangeFilterParams, 500);
    }

    componentWillUnmount() {
        this.onChangeFilterParamsDebounced.cancel();
    }

    componentDidUpdate() {
        if (!this.state.isTypingKeyword && !isEqual(this.props.filterParams, this.state.filterParams)) {
            this.setState({
                filterParams: this.props.filterParams,
            });
        }
    }

    onChangeFilterParams(name, value, debounce = false) {
        this.setState({
            filterParams: assign({}, this.state.filterParams, {
                [`${name}`]: value,
            }),
        });

        if (!debounce) {
            return this.props.onChangeFilterParams(name, value);
        }

        this.onChangeFilterParamsDebounced(name, value);
    }

    renderFilterBar() {
        const {
            filterParams,
        } = this.state;

        if (isEmpty(filterParams)) {
            return null;
        }

        const dropdowns = [
            {
                name: 'searchIssuesSort',
                title: 'Sort',
                defaultValue: 'sort:created-desc',
                items: [
                    {
                        label: 'Newest',
                        value: 'sort:created-desc',
                    },
                    {
                        label: 'Oldest',
                        value: 'sort:created-asc',
                    },
                    {
                        label: 'Recently updated',
                        value: 'sort:updated-desc',
                    },
                    {
                        label: 'Least updated',
                        value: 'sort:updated-asc',
                    },
                ],
            },
            {
                name: 'searchIssuesStatus',
                title: 'Status',
                defaultValue: 'is:open',
                items: [
                    {
                        label: 'Open',
                        value: 'is:open',
                    },
                    {
                        label: 'Closed',
                        value: 'is:closed',
                    },
                ],
            },
        ];

        const dropdownsOutput = dropdowns.map(dropdown => {
            if (!has(filterParams, dropdown.name)) {
                return false;
            }

            const activeItem = dropdown.items.filter(item => item.value === get(filterParams, dropdown.name, dropdown.defaultValue));
            const activeItemValue = activeItem.length === 1 ? activeItem[0].value : '';
            const activeItemLabel = activeItem.length === 1 ? activeItem[0].label : '';
            const dropdownTitle = () => {
                if (!activeItemLabel) {
                    return dropdown.title;
                }

                return `${dropdown.title}: ${activeItemLabel}`;
            }

            return (
                <DropdownButton
                    key={dropdown.name}
                    as={dropdown.as || InputGroup.Prepend}
                    variant={dropdown.variant || 'outline-secondary'}
                    title={dropdownTitle()}
                >
                    {
                        dropdown.items.map(item => <Dropdown.Item
                            key={item.value}
                            href="#"
                            active={activeItemValue === item.value}
                            onClick={() => this.onChangeFilterParams(dropdown.name, item.value)}
                        >
                            {item.label}
                        </Dropdown.Item>)
                    }
                </DropdownButton>
            );
        });

        const keywordOutput = has(filterParams, 'searchIssuesKeyword')
            ? <FormControl
                placeholder="Keyword"
                aria-label="Keyword"
                type="search"
                value={get(filterParams, 'searchIssuesKeyword', '')}
                onChange={(event) => this.onChangeFilterParams('searchIssuesKeyword', event.target.value, true)}
                onFocus={() => this.setState({ isTypingKeyword: true })}
                onBlur={() => this.setState({ isTypingKeyword: false })}
            />
            : null;

        if (isEmpty(dropdownsOutput) && isEmpty(keywordOutput)) {
            return null;
        }

        return (
            <InputGroup
                className="mb-3"
            >
                {dropdownsOutput}
                {keywordOutput}
            </InputGroup>
        );
    }

    renderPagination() {
        const {
            issues,
            currentPage,
            totalPages,
        } = this.props;

        if (!issues || !issues.length || issues instanceof Error) {
            return null;
        }

        const range = 2;
        const rangeLeft = currentPage - range;
        const rangeRight = currentPage + range + 1;
        const pages = [];
        const pagesAll = ['prev'];

        for (let index = 1; index <= totalPages; index++) {
            if (index === 1 || index === totalPages || (index >= rangeLeft && index < rangeRight)) {
                pages.push(index);
            }
        }

        if (pages.length < 2) {
            return null;
        }

        for (let index = 0; index < pages.length; index++) {
            pagesAll.push(pages[index]);

            const nextIndex = index + 1;

            if (pages[nextIndex] && pages[index] + 1 !== pages[nextIndex]) {
                pagesAll.push('...');
            }
        }

        pagesAll.push('next');

        const items = pagesAll.map((page, index) => {
            const pageKey = `${index}--${page}`
            const pagePrev = parseInt(currentPage - 1);
            const pageNext = parseInt(currentPage + 1);

            switch (page) {
                case '...':
                    return <Pagination.Ellipsis key={pageKey} disabled />;

                case 'prev':
                    return <Pagination.Prev key={pageKey} disabled={pagePrev < 1} onClick={() => this.props.onChangePagination(pagePrev)} />;

                case 'next':
                    return <Pagination.Next key={pageKey} disabled={pageNext > totalPages} onClick={() => this.props.onChangePagination(pageNext)} />;

                default:
                    return <Pagination.Item key={pageKey} active={page === currentPage} onClick={() => this.props.onChangePagination(page)}>{page}</Pagination.Item>;
            }
        });

        return (
            <Pagination>{items}</Pagination>
        );
    }

    renderActionButton(issue, name, icon) {
        const isButtonVisible = get(issue, `button${name}Visible`, get(this.props, `button${name}Visible`, false));

        if (!isButtonVisible) {
            return null;
        }

        const buttonActionHandler = get(this.props, `button${name}Handler`);
        const isButtonDisabled = get(issue, `button${name}Disabled`, get(this.props, `button${name}Disabled`, false));
        const buttonActionUrl = name === 'View' ? get(issue, 'html_url', false) : get(issue, `html_url_${name.toLowerCase()}`, false);
        const buttonActionText = icon ? <FontAwesomeIcon icon={icon} /> : name;

        const buttonOutput = buttonActionUrl
            ? (<Button variant="link" size="sm" href={buttonActionUrl} target="_blank" disabled={isButtonDisabled} title={name}>
                {buttonActionText}
            </Button>)
            : (<Button variant="link" size="sm" onClick={() => buttonActionHandler(issue)} disabled={isButtonDisabled} title={name}>
                {buttonActionText}
            </Button>);

        return (
            <OverlayTrigger key={`${issue.id}--${name}`} placement="top" overlay={<Tooltip>{name}</Tooltip>}>
                {buttonOutput}
            </OverlayTrigger>
        );

    }

    renderActionColumn(issue) {
        const actions = [{
            label: 'Edit',
            icon: faEdit,
        }, {
            label: 'Delete',
            icon: faTrash,
        }, {
            label: 'View',
            icon: faLink,
        }];

        const columnActions = actions.map(action => this.renderActionButton(issue, action.label, action.icon));
        const columnActionsCount = columnActions.filter(action => action).length;

        if (!columnActionsCount) {
            return null;
        }

        const columnWidth = (columnActionsCount * 30) + 28;

        return (
            <td className="text-center" style={{ width: `${columnWidth}px` }}>
                <ButtonGroup aria-label="Actions">
                    {columnActions}
                </ButtonGroup>
            </td>
        );

    }

    renderTable() {
        const textFetchingData = 'Fetching data...';
        const textNoRecords = 'No records found';
        const {
            issues,
            isFetchingData,
        } = this.props;

        const itemsOutput = () => {
            if (!issues || !issues.length || issues instanceof Error) {
                let textContent = textNoRecords;

                if (issues instanceof Error) {
                    textContent = issues.toString();
                }

                if (isFetchingData) {
                    textContent = textFetchingData;
                }

                return (
                    <tr>
                        <td className="text-center">
                            {textContent}
                        </td>
                    </tr>
                );
            }

            return issues.map((issue) => {
                const actionColumnOutput = this.renderActionColumn(issue);

                return (
                    <tr key={issue.id}>
                        <td>
                            <div>{issue.title}</div>
                        </td>
                        {actionColumnOutput}
                    </tr>
                );
            });
        };

        return (
            <LoadingOverlay
                active={isFetchingData}
                text={textFetchingData}
                spinner
            >
                <Table striped bordered hover>
                    <tbody>
                        {itemsOutput()}
                    </tbody>
                </Table>
                {this.renderPagination()}
            </LoadingOverlay>
        );
    }

    render() {
        return (
            <React.Fragment>
                {this.renderFilterBar()}
                {this.renderTable()}
            </React.Fragment>
        );
    }
}

BGICIssueList.propTypes = {
    issues: PropTypes.oneOfType([
        PropTypes.array,
        PropTypes.instanceOf(Error),
    ]),

    buttonEditVisible: PropTypes.bool,
    buttonEditDisabled: PropTypes.bool,
    buttonEditHandler: PropTypes.func,

    buttonDeleteVisible: PropTypes.bool,
    buttonDeleteDisabled: PropTypes.bool,
    buttonDeleteHandler: PropTypes.func,

    buttonViewVisible: PropTypes.bool,
    buttonViewDisabled: PropTypes.bool,
    buttonViewHandler: PropTypes.func,

    isFetchingData: PropTypes.bool,

    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    onChangePagination: PropTypes.func,

    filterParams: PropTypes.object,
    onChangeFilterParams: PropTypes.func,
};

BGICIssueList.defaultProps = {
    issues: [],

    buttonEditVisible: false,
    buttonEditDisabled: false,
    buttonEditHandler: noop,

    buttonDelete: false,
    buttonDeleteDisabled: false,
    buttonDeleteHandler: noop,

    buttonViewVisible: false,
    buttonViewDisabled: false,
    buttonViewHandler: noop,

    isFetchingData: false,

    currentPage: 1,
    totalPages: 1,
    onChangePagination: noop,

    filterParams: {},
    onChangeFilterParams: noop,
};

export default BGICIssueList;
