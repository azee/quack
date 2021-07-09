import React from 'react';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import * as Utils from '../common/Utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import $ from 'jquery';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';

class TestSuites extends SubComponent {

    testSuiteToRemove = null;

    state = {
        testSuites: [],
        testSuitesToDisplay: [],
        loading: true
    };


    constructor(props) {
        super(props);
        this.getTestSuites = this.getTestSuites.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.removeTestSuite = this.removeTestSuite.bind(this);
        this.removeTestSuiteConfirmation = this.removeTestSuiteConfirmation.bind(this);
        this.cancelRemoveTestSuiteConfirmation = this.cancelRemoveTestSuiteConfirmation.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        this.getTestSuites();
    }

    getTestSuites(){
       Backend.get(this.props.match.params.project + "/testsuite")
            .then(response => {
                 this.state.testSuites = response.data;
                 this.state.testSuitesToDisplay = this.state.testSuites.slice();
                 this.state.loading = false;
                 this.setState(this.state);
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get testsuites: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    onFilter(event){
        var token = (event.target.value || "").toLowerCase();
        this.state.testSuitesToDisplay = this.state.testSuites.filter(testSuite =>
                (testSuite.name || "").toLowerCase().includes(token));
        this.setState(this.state);
    }

    removeTestSuiteConfirmation(testSuiteId){
        this.testSuiteToRemove = testSuiteId;
        $("#remove-testsuite-confirmation").modal("show");
    }

    cancelRemoveTestSuiteConfirmation(){
        this.testSuiteToRemove = null;
        $("#remove-testsuite-confirmation").modal("hide");
    }

    removeTestSuite(event){
        Backend.delete(this.props.match.params.project + "/testsuite/" + this.testSuiteToRemove)
            .then(response => {
                // eslint-disable-next-line eqeqeq
                this.state.testSuites = this.state.testSuites.filter(testSuite => testSuite.id != this.testSuiteToRemove);
                this.state.testSuitesToDisplay = this.state.testSuites;
                this.testSuiteToRemove = null;
                $("#remove-testsuite-confirmation").modal("hide");
                this.setState(this.state);
        }).catch(error => {Utils.onErrorMessage("Couldn't delete testsuite: ", error)});
    }

    render() {
        return (
          <div>
            <div className="row">
                <form className="col-sm-5">
                  <div class="form-group">
                    <input type="text" class="form-control" id="filter" placeholder="Filter" onChange={this.onFilter}/>
                  </div>
                </form>
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
                {this.state.testSuitesToDisplay.map(function(testSuite){
                    return (
                            <div className="col-sm-6">
                                <div className="card testsuite-card col-sm-10">
                                  <div className="card-body">
                                    <div className="row">
                                        <div className="col-11">
                                            <h5 className="card-title">
                                                {testSuite.name}
                                            </h5>
                                        </div>
                                        <div className="col1">
                                            <span className="clickable edit-icon-visible red float-right" onClick={(e) => this.removeTestSuiteConfirmation(testSuite.id)}>
                                                <FontAwesomeIcon icon={faMinusCircle}/>
                                            </span>
                                        </div>
                                    </div>
                                    <p className="card-text">
                                        <Link to={'/' + this.props.match.params.project + '/testcases?testSuite=' + testSuite.id}>
                                            View
                                        </Link>
                                    </p>
                                  </div>
                                </div>
                                <div className="col-sm-1"></div>
                            </div>
                           );
                }.bind(this))}
            </div>

            <div className="modal fade" tabIndex="-1" role="dialog" id="remove-testsuite-confirmation">
                <div className="modal-dialog" role="document">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Remove Test Suite</h5>
                        <button type="button" className="close" onClick={this.cancelRemoveTestSuiteConfirmation} aria-label="Close">
                          <span aria-hidden="true">&times;</span>
                        </button>
                      </div>
                      <div className="modal-body">Are you sure you want to remove Test Suite?</div>
                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={this.cancelRemoveTestSuiteConfirmation}>Close</button>
                        <button type="button" className="btn btn-danger" onClick={this.removeTestSuite}>Remove Test Suite</button>
                      </div>
                    </div>
                 </div>
             </div>
          </div>
        );
      }

}

export default TestSuites;
