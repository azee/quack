/* eslint-disable react/jsx-no-duplicate-props */
/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import Select from 'react-select';
import AsyncSelect from 'react-select/lib/Async';
import $ from 'jquery';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class Issues extends SubComponent {
    constructor(props) {
        super(props);

        this.issueToRemove = null;

        this.defaultIssue = {
            name: "",
            type: {},
            description: "",
            priority: {},
            trackerProject: {}
        }

        this.state = {
             projectId: props.projectId,
             testcase: props.testcase || {issues: []},
             issue: Object.assign({}, this.defaultIssue),
             linkIssueView: {},
             suggestIssues: [],
             suggestTrackerProjects: [],
             issueTypes: [],
             issuePriorities: []
         };

         this.unlinkIssue = this.unlinkIssue.bind(this);
         this.unlinkIssueConfirmation = this.unlinkIssueConfirmation.bind(this);
         this.cancelUnlinkIssueConfirmation = this.cancelUnlinkIssueConfirmation.bind(this);
         this.getIssueUrl = this.getIssueUrl.bind(this);
         this.createIssue = this.createIssue.bind(this);
         this.handleChange = this.handleChange.bind(this);
         this.handleSelectChange = this.handleSelectChange.bind(this);
         this.changeLinkIssueId = this.changeLinkIssueId.bind(this);
         this.suggestIssues = this.suggestIssues.bind(this);
         this.suggestProjects = this.suggestProjects.bind(this);
         this.linkIssue = this.linkIssue.bind(this);
         this.changeTrackerProject = this.changeTrackerProject.bind(this);
         this.mapIssuePrioritiesToView = this.mapIssuePrioritiesToView.bind(this);
         this.mapIssueTypesToView = this.mapIssueTypesToView.bind(this);
         this.changeIssueType = this.changeIssueType.bind(this);
         this.changeIssuePriority = this.changeIssuePriority.bind(this);
         this.refreshIssues = this.refreshIssues.bind(this);
      }

    componentWillReceiveProps(nextProps) {
      if(nextProps.testcase){
        this.state.testcase = nextProps.testcase;
        this.setState(this.state);
      }
      if(nextProps.projectId && nextProps.projectId != this.state.projectId){
        this.state.projectId = nextProps.projectId;
        Backend.get(this.state.projectId + '/testcase/issue/projects')
            .then(response => {
                 this.state.suggestedTrackerProjects = response.data;
                 this.setState(this.state);
                 this.refreshIssues();
        }).catch(
          error => {
              Utils.onErrorMessage("Couldn't fetch projects from tracker: ", error);
        });
      }
      if (nextProps.testcase && (nextProps.testcase.issues || []).length != this.state.testcase.issues){
        this.refreshIssues();
      }
    }

    componentDidMount(){
        super.componentDidMount();
        this.onTestcaseUpdated = this.props.onTestcaseUpdated;
    }

    unlinkIssueConfirmation(issueId){
        this.issueToRemove = issueId;
        $("#unlink-issue-confirmation").modal("show");
    }

    cancelUnlinkIssueConfirmation(){
        this.issueToRemove = null;
        $("#unlink-issue-confirmation").modal("hide");
    }

    unlinkIssue(){
        Backend.delete(this.state.projectId + '/testcase/' + this.state.testcase.id  + '/issue/' + this.issueToRemove)
            .then(response => {
                this.issueToRemove = null;
                $("#unlink-issue-confirmation").modal("hide");
                this.onTestcaseUpdated();
        }).catch(error => {Utils.onErrorMessage("Couldn't unlink issue: ", error)});
    }

    createIssue(event){
        Backend.post(this.state.projectId + '/testcase/' + this.state.testcase.id + '/issue' , this.state.issue)
            .then(response => {
                $('#issue-modal').modal('hide');
                this.state.issue = Object.assign({}, this.defaultIssue);
                this.onTestcaseUpdated();
        }).catch(error => {Utils.onErrorMessage("Couldn't create issue: ", error)});
        event.preventDefault();
    }

    linkIssue(event){
        Backend.post(this.state.projectId + '/testcase/' + this.state.testcase.id + '/issue/link/' + this.state.linkIssueView.value || "" , this.state.issue)
            .then(response => {
                this.state.linkIssueView = {};
                $('#issue-modal').modal('hide');
                this.onTestcaseUpdated();
        }).catch(error => {Utils.onErrorMessage("Couldn't link issue: ", error)});
        event.preventDefault();

    }

    refreshIssues(){
        if (!this.state.testcase || !this.state.projectId) return;
        (this.state.testcase.issues || []).forEach(function(issue, index) {
            Backend.get(this.state.projectId + '/testcase/issue/' + issue.id)
                .then(response => {
                    this.state.testcase.issues[index] = response.data;
                    this.setState(this.state);
            });
        }.bind(this))
    }

    handleChange(event) {
       this.state.issue[event.target.name] = event.target.value;
       this.setState(this.state);
    }

    handleSelectChange(value, event) {
       this.state.issue[event.name] = value.value;
       this.setState(this.state);
    }

    suggestIssues(value, callback){
        var existingIssuesIds = (this.state.testcase.issues || []).map(issue => issue.id);
        Backend.get(this.state.projectId + '/testcase/issue/suggest?text=' + value)
            .then(response => {
                 this.state.suggestedIssues = (response.data || []).filter(issue => !existingIssuesIds.includes(issue.id));
                 this.setState(this.state);
                 callback(this.mapIssuesToView(this.state.suggestedIssues));
        });
    }

    suggestProjects(value, callback){
        Backend.get(this.state.projectId + '/testcase/issue/projects/suggest?text=' + value)
            .then(response => {
                 this.state.suggestedTrackerProjects = response.data;
                 this.setState(this.state);
                 callback(this.mapTrackerProjectsToView(this.state.suggestedTrackerProjects));
        });
    }

    changeLinkIssueId(value){
        this.state.linkIssueView = value;
        this.setState(this.state);
    }

    changeTrackerProject(value){
        this.state.issue.trackerProject = {name: value.label, id: value.value};
        this.setState(this.state);

        Backend.get(this.state.projectId + '/testcase/issue/types?project=' + this.state.issue.trackerProject.id)
            .then(response => {
                 this.state.issueTypes = response.data;
                 this.setState(this.state);
        });

        Backend.get(this.state.projectId + '/testcase/issue/priorities?project=' + this.state.issue.trackerProject.id)
            .then(response => {
                 this.state.issuePriorities = response.data;
                 this.setState(this.state);
        });
    }

    changeIssueType(value){
        this.state.issue.type = {name: value.label, id: value.value};
        this.setState(this.state);
    }

    changeIssuePriority(value){
        this.state.issue.priority = {name: value.label, id: value.value};
        this.setState(this.state);
    }


    mapIssuesToView(issues){
        return (issues || []).map(function(issue){return {value: issue.id, label: issue.id + " - " + issue.name}});
    }

    mapTrackerProjectsToView(trackerProjects){
        return (trackerProjects || []).map(function(trackerProject){return {value: trackerProject.id, label: trackerProject.name}});
    }

    mapIssueTypesToView(issueTypes){
        return (issueTypes || []).map(function(issueType){return {value: issueType.id, label: issueType.name}});
    }

    mapIssuePrioritiesToView(issuePriorities){
        return (issuePriorities || []).map(function(issuePriority){return {value: issuePriority.id, label: issuePriority.name}});
    }

    getIssueUrl(issue){
        return (
            <tr key={issue.id}>
                <td>
                    {issue.isClosed &&
                        <s><a href={issue.url || ""} target='_blank' rel="noreferrer">{issue.id} - {issue.name}</a></s>
                    }
                    {!issue.isClosed &&
                        <a href={issue.url || ""} target='_blank' rel="noreferrer">{issue.id} - {issue.name}</a>
                    }
                </td>
                <td>
                    {issue.type.name}
                </td>
                <td>
                    {issue.status}
                </td>
                <td>
                    {issue.priority.name}
                </td>
                <td>
                    <span className="clickable edit-icon-visible red" onClick={(e) => this.unlinkIssueConfirmation(issue.id, e)}>
                        <FontAwesomeIcon icon={faMinusCircle}/>
                    </span>
                </td>
            </tr>
        )
    }


    render() {
        return (
            <div>
                <div id="issues" className="issues-list">
                    <table className="table table-striped">
                      <tbody>
                        {(
                            (this.state.testcase.issues || []).map(this.getIssueUrl)
                        )}
                       </tbody>
                    </table>
                </div>

                <div>
                    <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#issue-modal">
                        Add Issue
                    </button>
                </div>
                <div className="modal fade bd-example-modal-lg" tabIndex="-1" role="dialog" id="issue-modal">
                    <div className="modal-dialog modal-lg" role="document">

                        <div className="modal-content">
                            <div className="modal-header">
                                <ul className="nav nav-tabs" id="issueTabs" role="tablist">
                                    <li className="nav-item">
                                        <a className="nav-link active" id="create-issue-tab" data-toggle="tab" href="#create-issue" role="tab" aria-controls="Create Issue" aria-selected="true">
                                            <h5 className="modal-title">Create Issue</h5>
                                        </a>
                                      </li>
                                      <li className="nav-item">
                                        <a className="nav-link" id="link-issue-tab" data-toggle="tab" href="#link-issue" role="tab" aria-controls="Link Issue" aria-selected="false">
                                            <h5 className="modal-title">Link Issue</h5>
                                        </a>
                                      </li>
                                </ul>
                                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>

                            <div className="tab-content" id="issuesTabContent">
                                <div className="tab-pane fade show active" id="create-issue" role="tabpanel" aria-labelledby="create-issue-tab">
                                    <div className="modal-body">
                                        <form>

                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Project</label>
                                                <div className="col-sm-9">
                                                    <Select value={{value: this.state.issue.trackerProject.id, label: this.state.issue.trackerProject.name}}
                                                            cacheOptions
                                                            onChange={this.changeTrackerProject}
                                                            options={this.mapTrackerProjectsToView(this.state.suggestedTrackerProjects)}
                                                           />
                                                </div>
                                            </div>


                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Name</label>
                                                <div className="col-sm-9">
                                                    <input type="text" className="form-control" name="name" onChange={this.handleChange} value={this.state.issue.name} />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Type</label>
                                                <div className="col-sm-9">
                                                    <Select name="type" value={{label: this.state.issue.type.name, value: this.state.issue.type.value}}
                                                        onChange={this.changeIssueType}
                                                        options={this.mapIssueTypesToView(this.state.issueTypes)}
                                                       />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Priority</label>
                                                <div className="col-sm-9">
                                                    <Select name="type" value={{label: this.state.issue.priority.name, value: this.state.issue.priority.id}}
                                                        name="priority"
                                                        onChange={this.changeIssuePriority}
                                                        options={this.mapIssuePrioritiesToView(this.state.issuePriorities)}
                                                       />
                                                </div>
                                            </div>
                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Description</label>
                                                <div className="col-sm-9">
                                                <textarea rows="7" name="description" className="form-control" onChange={this.handleChange} value={this.state.issue.description} ></textarea>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                        <button type="button" className="btn btn-primary" onClick={this.createIssue}>Create Issue</button>
                                    </div>

                                </div>


                                <div className="tab-pane fade" id="link-issue" role="tabpanel" aria-labelledby="link-issue-tab">
                                    <div className="modal-body">
                                        <form>
                                            <div className="form-group row">
                                                <label className="col-sm-3 col-form-label">Search</label>
                                                <div className="col-sm-9">
                                                    <AsyncSelect value={this.state.linkIssueView}
                                                            loadOptions={this.suggestIssues}
                                                            onChange={this.changeLinkIssueId}
                                                            options={this.mapIssuesToView(this.state.suggestedIssues)}
                                                           />
                                                </div>
                                            </div>

                                        </form>
                                    </div>
                                    <div className="modal-footer">
                                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                                        <button type="button" className="btn btn-primary" onClick={this.linkIssue}>Link Issue</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal fade" tabIndex="-1" role="dialog" id="unlink-issue-confirmation">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Unlink Issue</h5>
                            <button type="button" className="close" onClick={this.cancelUnlinkIssueConfirmation} aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div className="modal-body">Are you sure you want to unlink issue?</div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={this.cancelUnlinkIssueConfirmation}>Close</button>
                            <button type="button" className="btn btn-danger" onClick={this.unlinkIssue}>Unlink Issue</button>
                          </div>
                        </div>
                     </div>
                 </div>
            </div>

        );
      }


}

export default Issues;
