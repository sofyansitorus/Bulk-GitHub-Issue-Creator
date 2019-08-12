import React, { PureComponent } from 'react';

import {
    Container,
    Row,
    Col,
} from 'react-bootstrap';


class BGICPageWelcome extends PureComponent {
    youtubeId = '65goGnLQUuA';

    render() {
        return (
            <Container className="mt-5 py-5">
                <Row>
                    <Col md={6} className="mt-5">
                        <h1>Bulk GitHub Issue Creator</h1>
                        <p>A lightweigt, fast & responsive bulk issues creator for GitHub! Create a bunch of issues all at once by importing JSON or CSV file.</p>

                        <h5>Key Features:</h5>
                        <ul>
                            <li>Create single issue</li>
                            <li>Create bulk issues by impoting JSON & CSV file</li>
                            <li>Create bulk issues by copy & paste JSON & CSV formatted text</li>
                            <li>Edit existing issues</li>
                            <li>Markdown editor & preview</li>
                        </ul>
                    </Col>
                    <Col md={6}>
                        <div
                            className="video"
                            style={{
                                position: "relative",
                                paddingBottom: "56.25%" /* 16:9 */,
                                paddingTop: 25,
                                height: 0
                            }}
                        >
                            <iframe
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%"
                                }}
                                title="Bulk GitHub Issue Creator"
                                src={`https://www.youtube.com/embed/${this.youtubeId}`}
                                frameBorder="0"
                                allowFullScreen
                            />
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export default BGICPageWelcome;
