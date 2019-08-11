import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import {
    assign,
    isEqual,
    isNull,
} from 'lodash';

import {
    Tabs,
    Tab,
    Container,
    Row,
    Col,
} from 'react-bootstrap';

import BGICTabCreateSingleSingle from './tab-create-single-issue';
import BGICTabImportMultipleIssue from './tab-import-multiple-issue';
import BGICTabCreatedIssues from './tab-created-issues';
import BGICSidebar from './sidebar';

class BGICPageUserDashboard extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            activeTab: 'single',
            ownerSelected: false,
            repositorySelected: false,
            assigneesSelected: false,
            labelsSelected: false,
            milestonesSelected: false,
        };

        this.onSelectTab = this.onSelectTab.bind(this);
        this.onChangeOwner = this.onChangeOwner.bind(this);
        this.onChangeRepository = this.onChangeRepository.bind(this);
        this.onChangeAssignees = this.onChangeAssignees.bind(this);
        this.onChangeLabels = this.onChangeLabels.bind(this);
        this.onChangeMilestones = this.onChangeMilestones.bind(this);
    }

    onSelectTab(key) {
        this.setState({
            activeTab: key,
        });
    }

    onChangeOwner(ownerSelected) {
        if (isEqual(ownerSelected, this.state.ownerSelected)) {
            return;
        }

        this.setState({
            ownerSelected: isNull(ownerSelected) ? false : ownerSelected,
            repositorySelected: false,
            assigneesSelected: false,
            labelsSelected: false,
            milestonesSelected: false,
        });
    }

    onChangeRepository(repositorySelected) {
        if (isEqual(repositorySelected, this.state.repositorySelected)) {
            return;
        }

        this.setState({
            repositorySelected: isNull(repositorySelected) ? false : repositorySelected,
            labelsSelected: false,
            milestonesSelected: false,
        });
    }

    onChangeAssignees(assigneesSelected) {
        if (isEqual(assigneesSelected, this.state.assigneesSelected)) {
            return;
        }

        this.setState({
            assigneesSelected: isNull(assigneesSelected) ? false : assigneesSelected,
        });
    }

    onChangeLabels(labelsSelected) {
        if (isEqual(labelsSelected, this.state.labelsSelected)) {
            return;
        }

        this.setState({
            labelsSelected: isNull(labelsSelected) ? false : labelsSelected,
        });
    }

    onChangeMilestones(milestonesSelected) {
        if (isEqual(milestonesSelected, this.state.milestonesSelected)) {
            return;
        }

        this.setState({
            milestonesSelected: isNull(milestonesSelected) ? false : milestonesSelected,
        });
    }

    renderSideBar() {
        return (
            <BGICSidebar
                accessToken={this.props.accessToken}
                currentUser={this.props.currentUser}
                ownerSelected={this.state.ownerSelected}
                repositorySelected={this.state.repositorySelected}
                assigneesSelected={this.state.assigneesSelected}
                labelsSelected={this.state.labelsSelected}
                milestonesSelected={this.state.milestonesSelected}
                onChangeOwner={this.onChangeOwner}
                onChangeRepository={this.onChangeRepository}
                onChangeAssignees={this.onChangeAssignees}
                onChangeLabels={this.onChangeLabels}
                onChangeMilestones={this.onChangeMilestones}
                activeTab={this.state.activeTab}
            />
        );
    }

    renderContent() {
        const {
            accessToken
        } = this.props;

        const {
            ownerSelected,
            repositorySelected,
            assigneesSelected,
            labelsSelected,
            milestonesSelected,
        } = this.state;

        const tabProps = {
            accessToken,
            ownerSelected: ownerSelected,
            repositorySelected: repositorySelected,
            assigneesSelected: assigneesSelected,
            labelsSelected: labelsSelected,
            milestonesSelected: milestonesSelected,
        };

        if (milestonesSelected) {
            tabProps.milestone = milestonesSelected.number;
        }

        const tabs = [{
            eventKey: 'single',
            title: 'Create Single Issue',
            content: BGICTabCreateSingleSingle,
            props: tabProps,
        }, {
            eventKey: 'imported',
            title: 'Import Multiple Issue',
            content: BGICTabImportMultipleIssue,
            props: tabProps,
        }, {
            eventKey: 'created',
            title: 'Created Issues',
            content: BGICTabCreatedIssues,
            props: assign({}, tabProps, {
                onChangeAssignees: this.onChangeAssignees,
                onChangeLabels: this.onChangeLabels,
                onChangeMilestones: this.onChangeMilestones,
            }),
        }];

        return (
            <Tabs defaultActiveKey="single" onSelect={this.onSelectTab}>
                {
                    tabs.map((tab) => {
                        return (
                            <Tab
                                key={tab.eventKey}
                                eventKey={tab.eventKey}
                                title={tab.title}
                                className="border-right border-bottom border-left p-4 rounded"
                            >
                                {this.state.activeTab === tab.eventKey && React.createElement(
                                    tab.content,
                                    assign({}, tab.props, {
                                        tabKey: tab.eventKey,
                                        activeTabKey: this.state.activeTab,
                                    })
                                )}
                            </Tab>
                        )
                    })
                }
            </Tabs>
        );
    }

    render() {
        return (
            <Container className="mt-5">
                <Row>
                    <Col xs={12} md={8} className="mb-3">
                        {this.renderContent()}
                    </Col>
                    <Col xs={12} md={4} className="mb-3">
                        {this.renderSideBar()}
                    </Col>
                </Row>
            </Container>
        );
    }
}

BGICPageUserDashboard.propTypes = {
    accessToken: PropTypes.string.isRequired,
    currentUser: PropTypes.object.isRequired,
};

export default BGICPageUserDashboard;
