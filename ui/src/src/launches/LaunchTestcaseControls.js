/* eslint-disable eqeqeq */
/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from 'react';
import $ from 'jquery';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class LaunchTestcaseControls extends Component {
    defaultFailureDetails = {text: ""};

    state = {
        failureDetails: Object.assign({}, this.defaultFailureDetails)
    };

    constructor(props) {
        super(props);
        this.state.testcase = this.props.testcase;
        this.state.launchId = this.props.launchId;
        this.state.projectId = this.props.projectId;
        this.handleDetailsFailureChange = this.handleDetailsFailureChange.bind(this);
    }

    componentDidMount() {
        this.callback = this.props.callback || function(testcase){}
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.testcase) {
          this.state.testcase = nextProps.testcase;
      }
      if (nextProps.launchId) {
          this.state.launchId = nextProps.launchId;
      }
      this.setState(this.state);
    }

    handleStatusSubmit(status, event, dialogToDismiss){
        Backend.post(this.state.projectId + '/launch/' + this.state.launchId + '/' + this.state.testcase.uuid + '/status/' + status, this.state.failureDetails)
            .then(response => {
                this.state.testcase = response.data;
                this.state.failureDetails = Object.assign({}, this.defaultFailureDetails)
                this.setState(this.state);
                this.callback(this.state.testcase);
                if (dialogToDismiss){
                    $('#' + dialogToDismiss).modal('hide');
                }
        }).catch(error => {Utils.onErrorMessage("Couldn't save launch testcase status: ", error)});
        event.preventDefault();

    }

    renderRunnable(){
        return <button type="button" class="btn btn-success" onClick={(e) => this.handleStatusSubmit("RUNNING", e)}>Start</button>
    }

    renderRunning(){
        return(
            <div>
                <button type="button" class="btn btn-success" onClick={(e) => this.handleStatusSubmit("PASSED", e)}>Pass</button>
                <button type="button" class="btn btn-danger" data-toggle="modal" data-target="#fail-dialog">Fail</button>
                <button type="button" class="btn btn-warning" data-toggle="modal" data-target="#broken-dialog">Broken</button>
                <button type="button" class="btn btn-secondary" data-toggle="modal" data-target="#skipped-dialog">Skip</button>
                <button type="button" class="btn btn-warning" onClick={(e) => this.handleStatusSubmit("RUNNABLE", e)}>X</button>
            </div>
        )
    }

    renderFinished(){
        return(
            <div>
                <button class={this.getStatusAlertClass()} role="alert">
                  {this.state.testcase.launchStatus}
                </button>
                <button type="button" class="btn" onClick={(e) => this.handleStatusSubmit("RUNNABLE", e)}>X</button>
            </div>
        )
    }

    handleDetailsFailureChange(event){
        this.state.failureDetails[event.target.name] = event.target.value;
        this.setState(this.state);
    }

    getStatusAlertClass(){
        // eslint-disable-next-line default-case
        switch (this.state.testcase.launchStatus) {
          case 'FAILED':
            return 'alert alert-danger';
          case 'BROKEN':
            return 'alert alert-warning';
          case 'PASSED':
            return 'alert alert-success';
          case 'SKIPPED':
            return 'alert alert-secondary';
        }
        return 'alert';
    }

    renderButtons(){
        if (this.state.testcase.launchStatus == 'RUNNABLE'){
            return this.renderRunnable();
        } else if (this.state.testcase.launchStatus == 'RUNNING'){
            return this.renderRunning();
        } else {
            return this.renderFinished();
        }
    }

    render() {
        return (
            <div className="launch-status-controls">
                <div className="btn-group" role="group">
                    {this.renderButtons()}
                </div>

                <div className="modal fade" tabIndex="-1" role="dialog" id="fail-dialog">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Fail Test Case</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div className="modal-body">
                          <textarea rows="7" id="failure-text" name="text" className="form-control" value={this.state.failureDetails.text}
                                        placeholder="Reason of Failure" onChange={this.handleDetailsFailureChange} />
                          </div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">Close</button>
                            <button type="button" class="btn btn-danger" onClick={(e) => this.handleStatusSubmit("FAILED", e, 'fail-dialog')}>Fail</button>
                          </div>
                        </div>
                     </div>
                 </div>

                 <div className="modal fade" tabIndex="-1" role="dialog" id="broken-dialog">
                     <div className="modal-dialog" role="document">
                         <div className="modal-content">
                           <div className="modal-header">
                             <h5 className="modal-title">Mark Test Case as Broken</h5>
                             <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                               <span aria-hidden="true">&times;</span>
                             </button>
                           </div>
                           <div className="modal-body">
                           <textarea rows="7" id="failure-text" name="text" className="form-control" value={this.state.failureDetails.text}
                                         placeholder="Reason" onChange={this.handleDetailsFailureChange} />
                           </div>
                           <div className="modal-footer">
                             <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">Close</button>
                             <button type="button" class="btn btn-warning" onClick={(e) => this.handleStatusSubmit("BROKEN", e, 'broken-dialog')}>Mark as Broken</button>
                           </div>
                         </div>
                      </div>
                  </div>


                  <div className="modal fade" tabIndex="-1" role="dialog" id="skipped-dialog">
                       <div className="modal-dialog" role="document">
                           <div className="modal-content">
                             <div className="modal-header">
                               <h5 className="modal-title">Skip Test Case</h5>
                               <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                 <span aria-hidden="true">&times;</span>
                               </button>
                             </div>
                             <div className="modal-body">
                             <textarea rows="7" id="failure-text" name="text" className="form-control" value={this.state.failureDetails.text}
                                           placeholder="Reason of Skipping" onChange={this.handleDetailsFailureChange} />
                             </div>
                             <div className="modal-footer">
                               <button type="button" className="btn btn-secondary" data-dismiss="modal" aria-label="Cancel">Close</button>
                               <button type="button" class="btn btn-secondary" onClick={(e) => this.handleStatusSubmit("SKIPPED", e, 'skipped-dialog')}>Skip</button>
                             </div>
                           </div>
                        </div>
                    </div>
             </div>
        );
      }

}

export default LaunchTestcaseControls;
