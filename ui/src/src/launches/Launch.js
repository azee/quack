/* eslint-disable eqeqeq */
import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent'
import TestCase from '../testcases/TestCase'
import LaunchTestcaseControls from '../launches/LaunchTestcaseControls';
import LaunchAttributeStatsChart from '../launches/LaunchAttributeStatsChart';
import LaunchForm from '../launches/LaunchForm'
import { Link } from 'react-router-dom';
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';

import $ from 'jquery';

var jQuery = require('jquery');
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require('gijgo/js/gijgo.min.js');
require('gijgo/css/gijgo.min.css');

class Launch extends SubComponent {

    state = {
        launch: {
            launchStats: {
                statusCounters: {}
            },
            testSuite: {},
            restartFailedOnly: false
        },
        selectedTestCase: {
            uuid: null
        },
        attributesStatus: {},
        loading: true
    };

    constructor(props) {
        super(props);
        this.getLaunch = this.getLaunch.bind(this);
        this.buildTree = this.buildTree.bind(this);
        this.onTestcaseStateChanged = this.onTestcaseStateChanged.bind(this);
        if (this.props.match.params.testcaseUuid){
            this.state.selectedTestCase = {uuid: this.props.match.params.testcaseUuid};
        }
        this.state.projectId = this.props.match.params.project;
        this.showLaunchStats = this.showLaunchStats.bind(this);
        this.buildAttributesStatusMap = this.buildAttributesStatusMap.bind(this);
        this.addUnknownAttributesToAttributesStatusMap = this.addUnknownAttributesToAttributesStatusMap.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        Backend.get(this.state.projectId + "/attribute")
            .then(response => {
                 this.state.projectAttributes = response.data;
                 this.setState(this.state);
                 this.getLaunch(true);
            })
            .catch(error => console.log(error));
        this.interval = setInterval(this.getLaunch, 30000);
    }

    getLaunch(buildTree){
        Backend.get(this.state.projectId + "/launch/" + this.props.match.params.launchId)
            .then(response => {
                 this.state.launch = response.data;
                 if (!this.state.launch.testSuite || !this.state.launch.testSuite.filter){
                     this.state.launch.testSuite = {filter: {groups: []}};
                 }
                 if (this.state.selectedTestCase.uuid){
                     this.state.selectedTestCase = Utils.getTestCaseFromTree(this.state.selectedTestCase.uuid, this.state.launch.testCaseTree, function(testCase, id){return testCase.uuid === id} );
                 }
                 this.state.loading = false;
                 this.state.attributesStatus = {};
                 this.buildAttributesStatusMap(this.state.launch.testCaseTree);
                 this.addUnknownAttributesToAttributesStatusMap(this.state.launch.testCaseTree);
                 this.setState(this.state);
                 if (buildTree){
                    this.buildTree();
                 }
                 this.checkUpdatedTestCases();
        }).catch(error => {
            console.log(error);
            Utils.onErrorMessage("Couldn't get launch: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    buildTree(){
        if (this.tree){
            this.tree.destroy()
        }
        this.tree = $("#tree").tree({
            primaryKey: 'uuid',
            uiLibrary: 'bootstrap4',
            imageHtmlField: 'statusHtml',
            dataSource: Utils.parseTree(this.state.launch.testCaseTree)
        });

        this.tree.on('select', function (e, node, id) {
            this.state.selectedTestCase = Utils.getTestCaseFromTree(id, this.state.launch.testCaseTree, function(testCase, id){return testCase.uuid === id} );
            this.props.history.push("/" + this.state.projectId + '/launch/' + this.state.launch.id + '/' + id);
            this.setState(this.state);
        }.bind(this));
        if (this.state.selectedTestCase && this.state.selectedTestCase.uuid){
            var node = this.tree.getNodeById(this.state.selectedTestCase.uuid);
            this.tree.select(node);
            this.state.launch.testSuite.filter.groups.forEach(function(groupId){
                var selectedTestCaseInTree = Utils.getTestCaseFromTree(this.state.selectedTestCase.uuid, this.state.launch.testCaseTree, function(testCase, id){return testCase.uuid === id});
                var attributes = selectedTestCaseInTree.attributes || [];
                var attribute = attributes.find(function(attribute){return attribute.id === groupId}) || {} ;
                var values = attribute.values || ["None"];
                values.forEach(function(value){
                    var node = this.tree.getNodeById(groupId + ":" + value);
                    this.tree.expand(node);
                }.bind(this))

            }.bind(this))
        }
    }

    buildAttributesStatusMap(head){
        head.testCases.forEach(testCase => {
            Object.keys(testCase.attributes).forEach(attrKey => {
                if (!this.state.attributesStatus[attrKey]){
                    this.state.attributesStatus[attrKey] = {
                        name: Utils.getProjectAttribute(this.state.projectAttributes, attrKey).name || "",
                        values: {}
                    };
                }

                testCase.attributes[attrKey].forEach(attrValue =>{
                    if (!this.state.attributesStatus[attrKey].values[attrValue]){
                        this.state.attributesStatus[attrKey].values[attrValue] = {
                            PASSED: 0,
                            FAILED: 0,
                            BROKEN: 0,
                            SKIPPED: 0,
                            RUNNABLE: 0,
                            RUNNING: 0
                        };
                    }
                    this.state.attributesStatus[attrKey].values[attrValue][testCase.launchStatus] = this.state.attributesStatus[attrKey].values[attrValue][testCase.launchStatus] + 1;
                })

            })

        })
        head.children.forEach(this.buildAttributesStatusMap);
    }

    addUnknownAttributesToAttributesStatusMap(head){
        head.testCases.forEach(testCase => {

            Object.keys(this.state.attributesStatus).forEach(attrKey => {
                if (!testCase.attributes[attrKey]){
                    if (!this.state.attributesStatus[attrKey].values["Unknown"]){
                        this.state.attributesStatus[attrKey].values["Unknown"] = {
                            PASSED: 0,
                            FAILED: 0,
                            BROKEN: 0,
                            SKIPPED: 0,
                            RUNNABLE: 0,
                            RUNNING: 0
                        }
                    }
                    this.state.attributesStatus[attrKey].values["Unknown"][testCase.launchStatus] = this.state.attributesStatus[attrKey].values["Unknown"][testCase.launchStatus] + 1;
                }
            })

        })
        head.children.forEach(this.buildAttributesStatusMap);
    }

    onTestcaseStateChanged(testcase){
        var updatedTestCase = Utils.getTestCaseFromTree(testcase.uuid, this.state.launch.testCaseTree, function(existingTestCase, id){return existingTestCase.uuid === testcase.uuid} );
        Object.assign(updatedTestCase, testcase);
        this.tree.dataSource = Utils.parseTree(this.state.launch.testCaseTree);

        var testCaseHtmlNode = $("li[data-id='" + testcase.uuid + "']").find("img");
        testCaseHtmlNode.attr("src", Utils.getStatusImg(testcase));

        if(this.state.selectedTestCase.uuid == testcase.uuid){
            this.state.selectedTestCase = testcase;
            this.setState(this.state);
        }

        var that = this;
        if (testcase && testcase.uuid){
            $(that.tree.getNodeById(testcase.uuid)[0]).parents('.list-group-item').each((num, node) => {
                    var nodeId = ((node.dataset || {}).id || "");
                    var dataNode = Utils.getNodeFromDataSource(nodeId, {children: that.tree.dataSource});
                    var htmlImageNode = $(node).find("img")[0];
                    var nodeImage = Utils.getNodeStatusImg(dataNode);
                    $(htmlImageNode).attr("src", nodeImage);
            });
        }
    }

    checkUpdatedTestCases(){
        if (!this.testCasesStateMap){
            this.buildTestCasesStateMap(this.state.launch.testCaseTree);
        }
        this.updateTestCasesStateFromLaunch(this.state.launch.testCaseTree);
    }

    updateTestCasesStateFromLaunch(tree){
        tree.testCases.forEach(function(testCase){
            if (this.testCasesStateMap && this.testCasesStateMap[testCase.uuid] !== testCase.launchStatus){
                this.onTestcaseStateChanged(testCase);
            }
        }.bind(this))
        tree.children.forEach(function(child){
            this.updateTestCasesStateFromLaunch(child);
        }.bind(this))
    }

    buildTestCasesStateMap(tree){
        this.testCasesStateMap = {};
        tree.testCases.forEach(function(testCase){
            this.testCasesStateMap[testCase.uuid] = testCase.launchStatus;
        }.bind(this))
        tree.children.forEach(function(child){
            this.buildTestCasesStateMap(child);
        }.bind(this))
    }

    showLaunchStats(event){
        this.state.selectedTestCase.uuid = null;
        this.setState(this.state);
    }

    onLaunchRestart(failedOnly, event){
        this.state.restartFailedOnly = failedOnly;
         this.setState(this.state);
        $("#restart-launch-modal").modal('toggle');
        event.preventDefault();
    }

    render() {
        return (
          <div>
              <div className = "launch-title">
                <h3>
                    <Link to={'/' + this.state.projectId + '/launch/' + this.state.launch.id} onClick={this.showLaunchStats}>
                        {this.state.launch.name}
                    </Link>
                </h3>

              </div>
              <div className="row">

                  <div className='sweet-loading'>
                         <FadeLoader
                           sizeUnit={"px"}
                           size={100}
                           color={'#135f38'}
                           loading={this.state.loading}
                         />
                   </div>

                  <div className="tree-side col-5">
                      <div id="tree"></div>
                  </div>
                  <div id="testCase" className="testcase-side col-7">
                     {this.state.selectedTestCase && this.state.selectedTestCase.uuid &&
                          <TestCase
                            testcase={this.state.selectedTestCase}
                            projectAttributes={this.state.projectAttributes}
                            readonly={true}
                            launchId={this.state.launch.id}
                            projectId={this.state.projectId}
                          />
                      }
                      {this.state.selectedTestCase && this.state.selectedTestCase.uuid &&
                            <LaunchTestcaseControls
                                testcase={this.state.selectedTestCase}
                                launchId={this.state.launch.id}
                                projectId={this.state.projectId}
                                callback={this.onTestcaseStateChanged}
                            />
                      }
                      {(!this.state.selectedTestCase || !this.state.selectedTestCase.uuid) &&
                              <div>
                              {this.state.launch.launchGroup &&
                                  <div className="row launch-summary-block">
                                      <div className="col-6">
                                          <Link to={'/' + this.state.projectId + '/launches?launchGroup=' + this.state.launch.launchGroup} >
                                              View Launch Group
                                          </Link>
                                      </div>
                                  </div>
                                  }
                               {(this.state.launch.testSuite || {}).id &&
                                <div className="row launch-summary-block">
                                    <div className="col-2">Test Suite:</div>
                                    <div className="col-4">
                                        <Link to={'/' + this.state.projectId + '/testcases?testSuite=' + this.state.launch.testSuite.id} >
                                            {this.state.launch.testSuite.name}
                                        </Link>
                                    </div>
                                </div>
                                }
                                <div className="row launch-summary-block">
                                    <div className="col-4">
                                        Created at: {Utils.timeToDate(this.state.launch.createdTime)}
                                    </div>
                                    <div className="col-4">
                                        Started at: {Utils.timeToDate(this.state.launch.startTime)}
                                    </div>
                                    <div className="col-4">
                                        Finished at: {Utils.timeToDate(this.state.launch.finishTime)}
                                    </div>
                                </div>
                                <div className="progress launch-summary-block">
                                  <div className="progress-bar progress-bar-striped" role="progressbar" style={Utils.getProgressBarStyle(this.state.launch.launchStats.statusCounters.RUNNING, this.state.launch.launchStats.total)}>
                                    {Utils.getProgressBarNumber(this.state.launch.launchStats.statusCounters.RUNNING, this.state.launch.launchStats.total)}
                                  </div>
                                  <div className="progress-bar bg-success" role="progressbar" style={Utils.getProgressBarStyle(this.state.launch.launchStats.statusCounters.PASSED, this.state.launch.launchStats.total)}>
                                    {Utils.getProgressBarNumber(this.state.launch.launchStats.statusCounters.PASSED, this.state.launch.launchStats.total)}
                                  </div>
                                  <div className="progress-bar bg-danger" role="progressbar" style={Utils.getProgressBarStyle(this.state.launch.launchStats.statusCounters.FAILED, this.state.launch.launchStats.total)}>
                                    {Utils.getProgressBarNumber(this.state.launch.launchStats.statusCounters.FAILED, this.state.launch.launchStats.total)}
                                  </div>
                                  <div className="progress-bar bg-warning" role="progressbar" style={Utils.getProgressBarStyle(this.state.launch.launchStats.statusCounters.BROKEN, this.state.launch.launchStats.total)}>
                                    {Utils.getProgressBarNumber(this.state.launch.launchStats.statusCounters.BROKEN, this.state.launch.launchStats.total)}
                                  </div>
                                  <div className="progress-bar progress-bar-striped bg-warning" role="progressbar" style={Utils.getProgressBarStyle(this.state.launch.launchStats.statusCounters.SKIPPED, this.state.launch.launchStats.total)}>
                                    {Utils.getProgressBarNumber(this.state.launch.launchStats.statusCounters.SKIPPED, this.state.launch.launchStats.total)}
                                  </div>
                                </div>

                                <div className="restart-launch-control">
                                    <button type="button" className="btn btn-primary" onClick={(e) => this.onLaunchRestart(false, e)}>Restart All</button>
                                    <button type="button" className="btn btn-danger" onClick={(e) => this.onLaunchRestart(true, e)}>Restart Failed</button>
                                </div>

                                {this.state.launch.launcherConfig && this.state.launch.launcherConfig.launcherId &&
                                    <div className="launcher-details">
                                        <h5>External Launch:
                                            { this.state.launch.launcherConfig.externalLaunchUrl &&
                                                <a className="external-launch-link" target="_blank" href={this.state.launch.launcherConfig.externalLaunchUrl} rel="noreferrer">
                                                    {this.state.launch.launcherConfig.name}
                                                </a>
                                            }
                                            { !this.state.launch.launcherConfig.externalLaunchUrl &&
                                                this.state.launch.launcherConfig.name
                                            }
                                        </h5>
                                        <dl>
                                        {this.state.launch.launcherConfig.reportUrl &&
                                            <span>
                                                <dt>Report</dt>
                                                <dd><a href={this.state.launch.launcherConfig.reportUrl}>View</a></dd>
                                            </span>
                                        }
                                        {Object.keys(this.state.launch.launcherConfig.properties).map(
                                            function(key){
                                                return (
                                                    <span>
                                                    <dt>{key}</dt>
                                                    <dd>{this.state.launch.launcherConfig.properties[key]}</dd>
                                                    </span>
                                                )
                                            }.bind(this)
                                        )}
                                        </dl>
                                    </div>
                                }


                                <div className="launch-attr-stats">
                                    {Object.keys(this.state.attributesStatus).map(attrKey =>{
                                        return(<LaunchAttributeStatsChart key={attrKey} attrKey={attrKey} stats={this.state.attributesStatus[attrKey]} />)
                                    })

                                    }
                                </div>

                              </div>
                        }
                  </div>
                </div>

                <div className="modal fade" id="restart-launch-modal" tabIndex="-1" role="dialog" aria-labelledby="launchLabel" aria-hidden="true">
                    <LaunchForm launch={this.state.launch} restart={true} failedOnly={this.state.restartFailedOnly}/>
                </div>

          </div>
        );
      }

}

export default withRouter(Launch);
