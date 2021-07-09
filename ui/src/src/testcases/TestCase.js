/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import Attachments from '../testcases/Attachments'
import Issues from '../testcases/Issues'
import Comments from '../comments/Comments'
import EventsWidget from '../audit/EventsWidget'
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import CreatableSelect from 'react-select/lib/Creatable'
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import { faPlug } from '@fortawesome/free-solid-svg-icons'
import { Checkbox } from 'semantic-ui-react'
import { ConfirmButton } from '../common/uicomponents/ConfirmButton'
import Backend from '../services/backend';

class TestCase extends SubComponent {
    constructor(props) {
        super(props);
        this.state = {
             testcase: {
                 id: null,
                 importedName: "",
                 description: "",
                 steps: [],
                 attributes: {},
                 attachments: [],
                 properties: [],
                 broken: false
             },
             originalTestcase: {
                steps: [],
                attributes: {}
             },
             projectAttributes: [],
             readonly: false,
             attributesInEdit: new Set(),
             propertiesInEdit: new Set(),
             commentsCount: 0,
             loading: true
         };
         this.getTestCase = this.getTestCase.bind(this);
         this.handleSubmit = this.handleSubmit.bind(this);
         this.toggleEdit = this.toggleEdit.bind(this);
         this.handleChange = this.handleChange.bind(this);
         this.cancelEdit = this.cancelEdit.bind(this);
         this.getAttributeName = this.getAttributeName.bind(this);
         this.getAttributeValues = this.getAttributeValues.bind(this);
         this.editAttributeValues = this.editAttributeValues.bind(this);
         this.cancelEditAttributeValues = this.cancelEditAttributeValues.bind(this);
         this.cancelEditAttributeKey = this.cancelEditAttributeKey.bind(this);
         this.removeAttribute = this.removeAttribute.bind(this);
         this.addAttribute = this.addAttribute.bind(this);
         this.addProperty = this.addProperty.bind(this);
         this.editAttributeKey = this.editAttributeKey.bind(this);
         this.handleStepActionChange = this.handleStepActionChange.bind(this);
         this.handleStepExpectationChange = this.handleStepExpectationChange.bind(this);
         this.addStep = this.addStep.bind(this);
         this.removeStep = this.removeStep.bind(this);
         this.toggleEditAttribute = this.toggleEditAttribute.bind(this);
         this.getAttributeKeysToAdd = this.getAttributeKeysToAdd.bind(this);
         this.onTestcaseUpdated = this.onTestcaseUpdated.bind(this);
         this.onCommentsCountChanged = this.onCommentsCountChanged.bind(this);
         this.removeTestcase = this.removeTestcase.bind(this);
         this.getAttributes = this.getAttributes.bind(this);
         this.cancelEditProperty = this.cancelEditProperty.bind(this);
         this.toggleEditProperty = this.toggleEditProperty.bind(this);
         this.onBrokenToggle = this.onBrokenToggle.bind(this);
      }

    componentDidMount() {
        super.componentDidMount();
        if (this.props.readonly){
            this.state.readonly = true;
        }
        if (this.props.testcase){
            this.state.testcase = this.props.testcase;
        } else if (this.props.testcaseId){
            this.projectId = this.props.projectId;
            this.getTestCase(this.props.projectId, this.props.testcaseId);
        } else if(this.props.match) {
            this.projectId = this.props.match.params.project;
            this.getTestCase(this.props.match.params.project, this.props.match.params.testcase);
        }
        if (this.props.launchId){
            this.state.launchId = this.props.launchId;
        }
        this.setState(this.state);
     }

    componentWillReceiveProps(nextProps, nextState) {
      if (nextProps.testcase){
        this.state.testcase = nextProps.testcase;
        this.state.loading = false;
      } else if(nextProps.testcaseId){
        this.projectId = nextProps.projectId;
        this.getTestCase(nextProps.projectId, nextProps.testcaseId);
      }
      if (nextProps.projectAttributes){
        this.state.projectAttributes = nextProps.projectAttributes;
      } else {
        this.getAttributes();
      }
      if (nextProps.launchId){
          this.state.launchId = nextProps.launchId;
      }
      if (nextProps.projectId){
          this.projectId = nextProps.projectId;
      }
      this.setState(this.state);
    }

    onTestcaseUpdated(count){
        this.getTestCase(this.projectId, this.state.testcase.id);
        this.getAttributes();
    }

    getTestCase(projectId, testcaseId){
       Backend.get(projectId + "/testcase/"+ testcaseId)
          .then(response => {
            this.state.testcase = response.data;
            this.state.originalTestcase = JSON.parse(JSON.stringify(this.state.testcase));
            this.state.attributesInEdit.clear();
            this.state.propertiesInEdit.clear();
            this.state.loading = false;
            this.setState(this.state);
          })
          .catch(error => {
            Utils.onErrorMessage("Couldn't fetch testcase: ", error);
            this.state.loading = false;
            this.setState(this.state);
          });
    }

    handleChange(fieldName, event, index, arrObjectKey){
        if (index != undefined){
            if (arrObjectKey){
                this.state.testcase[fieldName][index][arrObjectKey] = event.target.value;
            } else {
                this.state.testcase[fieldName][index] = event.target.value;
            }
        } else {
            this.state.testcase[fieldName] = event.target.value;
        }

        this.setState(this.state);
    }

    cancelEdit(fieldName, event, index){
        if (index){
            this.state.testcase[fieldName][index] = this.state.originalTestcase[fieldName][index];
        } else {
            this.state.testcase[fieldName] = this.state.originalTestcase[fieldName];
        }

        this.setState(this.state);
        this.toggleEdit(fieldName, event, index);
    }

    handleSubmit(fieldName, event, index, ignoreToggleEdit){
        Backend.put(this.projectId + '/testcase/', this.state.testcase)
            .then(response => {
                this.state.testcase = response.data;
                this.state.originalTestcase = JSON.parse(JSON.stringify(this.state.testcase));
                this.state.attributesInEdit.clear()
                this.state.propertiesInEdit.clear();
                this.setState(this.state);
                this.getAttributes();
                if (!ignoreToggleEdit){
                    this.toggleEdit(fieldName, event, index);
                }

        }).catch(error => {Utils.onErrorMessage("Couldn't save testcase: ", error)});
        if (event){
            event.preventDefault();
        }
    }

    getAttributes(reRender){
       Backend.get(this.projectId + "/attribute")
          .then(response => {
               this.state.projectAttributes = response.data;
               this.setState(this.state);
          })
          .catch(error => {Utils.onErrorMessage("Couldn't fetch attributes: ", error)});
    }

    toggleEdit(fieldName, event, index){
        var fieldId = fieldName;
        if (index !== undefined){
            fieldId = fieldId + "-" + index;
        }
        if($("#" + fieldId + "-display").offsetParent !== null){
            if (index){
                this.state.originalTestcase[fieldName][index] = JSON.parse(JSON.stringify(this.state.testcase[fieldName][index] || ""));
            } else {
                this.state.originalTestcase[fieldName] = JSON.parse(JSON.stringify(this.state.testcase[fieldName] || ""));
            }
        }
        $("#" + fieldId + "-display").toggle();
        $("#" + fieldId + "-form").toggle();
        if (event){
            event.preventDefault();
        }

    }

    getAttributeName(id){
        return Utils.getProjectAttribute(this.state.projectAttributes, id).name || ""
    }

    getAttributeValues(id){
        return Utils.getProjectAttribute(this.state.projectAttributes, id).attrValues || []
    }

    editAttributeValues(key, values){
        this.state.originalTestcase["attributes"][key] = this.state.testcase["attributes"][key];
        this.state.testcase["attributes"][key] = values.map(function(value){return value.value});
        this.setState(this.state);
    }

    cancelEditAttributeValues(event, key){
        this.state.testcase["attributes"][key] = this.state.originalTestcase["attributes"][key];
        this.state.attributesInEdit.delete(key);
        this.setState(this.state);
        this.toggleEdit("attributes", event, key);
    }

    cancelEditAttributeKey(event, key){
        if (this.state.testcase.attributes[key] === undefined ||
           key === undefined ||
           this.state.testcase.attributes[key].values === undefined ||
           this.state.testcase.attributes[key].values === null ||
           this.state.testcase.attributes[key].values.length == 0)
        delete this.state.testcase.attributes[key];
        this.state.attributesInEdit.delete(key);
        this.setState(this.state);
    }

    removeAttribute(key, event){
        delete this.state.testcase.attributes[key];
        this.state.attributesInEdit.delete(key);
        this.handleSubmit("attributes", event, 0, true);
    }

    addAttribute(event){
        if (!this.state.testcase.attributes){
            this.state.testcase.attributes = {};
        }
        this.state.testcase.attributes[null] = [];
        this.state.attributesInEdit.add(null);
        this.setState(this.state);
    }

    addProperty(event){
        if (!this.state.testcase.properties){
            this.state.testcase.properties = [];
            this.state.originalTestcase.properties = [];
        }
        this.state.testcase.properties.push({key: "", value: ""});
        this.state.originalTestcase.properties.push({key: "", value: ""});
        this.state.propertiesInEdit.add(this.state.testcase.properties.length - 1);
        this.setState(this.state);
    }

    toggleEditProperty(event, index){
        this.state.originalTestcase.properties[index] = JSON.parse(JSON.stringify(this.state.testcase.properties[index]));
        this.state.propertiesInEdit.add(index);
        this.setState(this.state);
    }

    removeProperty(index, event){
        this.state.testcase.properties.splice(index, 1)
        this.state.propertiesInEdit.delete(index);
        this.handleSubmit("properties", event, 0, true);

    }

    cancelEditProperty(index, event){
        var originalProperty = this.state.originalTestcase.properties[index];
        if (originalProperty.key == "" && originalProperty.value == ""){
            this.removeProperty(index, event);
        } else {
            this.state.testcase.properties[index] = originalProperty;
            this.state.propertiesInEdit.delete(index);
            this.toggleEdit("properties", event, index, true);
            this.setState(this.state);
        }
    }

    editAttributeKey(key, data, reRender){
        if(this.state.projectAttributes.find(function(attribute){return attribute.id === data.value}) == undefined){
            this.state.projectAttributes.push({id: data.value, name: data.value});
        }
        this.state.attributesInEdit.delete(key);
        this.state.attributesInEdit.add(data.value);
        this.state.testcase.attributes[data.value] = this.state.testcase.attributes[key];
        delete this.state.testcase.attributes[key];
        if (reRender){
            this.setState(this.state);
        }
    }

    handleStepActionChange(index, event, reRender){
        this.state.testcase.steps[index].action = event.target.value;
        if (reRender){
            this.setState(this.state);
        }
    }

    handleStepExpectationChange(index, event, reRender){
        this.state.testcase.steps[index].expectation = event.target.value;
        if (reRender){
            this.setState(this.state);
        }
    }

    addStep(){
        if (!this.state.testcase.steps){
            this.state.testcase.steps = [];
        }
        this.state.testcase.steps.push({});
        this.setState(this.state);
    }

    removeStep(event, index){
        this.state.testcase.steps.splice(index, 1);
        this.setState(this.state);
        this.handleSubmit("steps", event, index, true);
    }

    toggleEditAttribute(attributeId){
        this.state.attributesInEdit.add(attributeId);
        this.setState(this.state);
    }

    getAttributeKeysToAdd(){
        return (this.state.projectAttributes || [])
            .filter(attribute => !(Object.keys(this.state.testcase.attributes || {}) || []).includes(attribute.id))
            .map(attribute => ({value: attribute.id, label: attribute.name}));
    }

    onCommentsCountChanged(count){
         this.state.commentsCount = count;
         this.setState(this.state);
    }

    removeTestcase(){
        Backend.delete(this.projectId + '/testcase/' + this.state.testcase.id)
            .then(response => {
                window.location.href = window.location.href.replace("testcase=" + this.state.testcase.id, "")
        }).catch(error => {Utils.onErrorMessage("Couldn't remove testcase: ", error)});
    }

    onBrokenToggle() {
        this.state.testcase.broken = !this.state.testcase.broken;
        this.handleSubmit(null, null, null, true);
    }

    render() {
        return (
            <div>
            <ul className="nav nav-tabs" id="tcTabs" role="tablist">
                <li className="nav-item">
                    <a className="nav-link active" id="main-tab" data-toggle="tab" href="#main" role="tab" aria-controls="home" aria-selected="true">Main</a>
                  </li>

                  {this.state.testcase.failureDetails && Object.keys(this.state.testcase.failureDetails).length > 0 &&
                    <li className="nav-item">
                      <a className="nav-link" id="failure-tab" data-toggle="tab" href="#failure" role="tab" aria-controls="failure" aria-selected="false">Failure</a>
                    </li>
                   }


                  <li className="nav-item">
                    <a className="nav-link" id="attachments-tab" data-toggle="tab" href="#attachments" role="tab" aria-controls="attachments" aria-selected="false">
                        Attachments
                        {this.state.testcase.attachments && this.state.testcase.attachments.length > 0 &&
                            <span className="badge badge-pill badge-secondary tab-badge">{this.state.testcase.attachments.length}</span>
                        }
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" id="issues-tab" data-toggle="tab" href="#issues" role="tab" aria-controls="issues" aria-selected="false">
                        Issues
                        {this.state.testcase.issues && this.state.testcase.issues.length > 0 &&
                            <span className="badge badge-pill badge-secondary tab-badge">{this.state.testcase.issues.length}</span>
                        }
                    </a>
                  </li>
                  <li className="nav-item">
                     <a className="nav-link" id="comments-tab" data-toggle="tab" href="#comments-tab-body" role="tab" aria-controls="comments-tab-body" aria-selected="false">
                     Comments
                     {this.state.commentsCount > 0 &&
                         <span className="badge badge-pill badge-secondary tab-badge">{this.state.commentsCount}</span>
                     }
                     </a>
                  </li>
                  {this.state.testcase.metaData && Object.keys(this.state.testcase.metaData).length > 0 &&
                  <li className="nav-item">
                    <a className="nav-link" id="history-tab" data-toggle="tab" href="#metadata" role="tab" aria-controls="metadata" aria-selected="false">Metadata</a>
                  </li>
                  }
                  <li className="nav-item">
                    <a className="nav-link" id="history-tab" data-toggle="tab" href="#history" role="tab" aria-controls="history" aria-selected="false">History</a>
                  </li>
            </ul>

            <div className="tab-content" id="tcTabContent">
                <div className='sweet-loading'>
                       <FadeLoader
                         sizeUnit={"px"}
                         size={100}
                         color={'#135f38'}
                         loading={this.state.loading}
                       />
                 </div>
               <div className="tab-pane fade show active" id="main" role="tabpanel" aria-labelledby="main-tab">
                  <div id="name" className="testcase-section">
                    <div id="name-display" className="inplace-display row">
                        <div className="col-10">
                            <h1>
                                <Link to={"/" + this.projectId + "/testcase/" + this.state.testcase.id}>
                                    {this.state.testcase.name || this.state.testcase.importedName || ""}
                                </Link>
                                <span className="name-icon">
                                    {this.state.testcase.automated &&
                                        <FontAwesomeIcon icon={faPlug}/>
                                    }
                                </span>
                                <span>
                                    {!this.state.readonly &&
                                        <span className="edit edit-icon clickable" onClick={(e) => this.toggleEdit("name", e)}><FontAwesomeIcon icon={faPencilAlt}/></span>
                                    }
                                </span>
                            </h1>
                        </div>
                        {!this.state.readonly &&
                        <div className="col-2">
                            <Checkbox toggle onChange={this.onBrokenToggle} checked={!this.state.testcase.broken} label={{ children: this.state.testcase.broken? 'Off' : 'On' }} />
                        </div>
                        }
                    </div>
                    {!this.state.readonly &&
                        <div id="name-form" className="inplace-form" style={{display: 'none'}}>
                            <form>
                                <div className="form-group row">
                                    <div className="col-8">
                                        <input type="text" name="name" className="form-control" onChange={(e) => this.handleChange("name", e)} value={this.state.testcase.name || this.state.testcase.importedName}/>
                                    </div>
                                    <div className="col-4">
                                        <button type="button" className="btn btn-light" data-dismiss="modal" onClick={(e) => this.cancelEdit("name", e)}>Cancel</button>
                                        <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("name", e)}>Save</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    }
                  </div>

                  <div id="description" className="testcase-section">
                    <h5>
                        Description
                        {!this.state.readonly &&
                            <span className="edit edit-icon clickable" onClick={(e) => this.toggleEdit("description", e)}><FontAwesomeIcon icon={faPencilAlt}/></span>
                        }
                    </h5>
                    <div id="description-display" className="inplace-display">
                        {this.state.testcase.description}
                    </div>
                    {!this.state.readonly &&
                        <div id="description-form" className="inplace-form" style={{display: 'none'}}>
                            <form>
                                <textarea rows="7" name="description" className="form-control" onChange={(e) => this.handleChange("description", e)} value={this.state.testcase.description}></textarea>
                                <div className="testcase-inplace-buttons-down">
                                    <button type="button" className="btn btn-light" data-dismiss="modal" onClick={(e) => this.cancelEdit("description", e)}>Cancel</button>
                                    <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("description", e)}>Save</button>
                                </div>
                            </form>
                        </div>
                    }
                  </div>

                  <div id="preconditions" className="testcase-section">
                      <h5>
                          Preconditions
                          {!this.state.readonly &&
                            <span className="edit edit-icon clickable" onClick={(e) => this.toggleEdit("preconditions", e)}><FontAwesomeIcon icon={faPencilAlt}/></span>
                          }
                      </h5>
                      <div id="preconditions-display" className="inplace-display">
                          {this.state.testcase.preconditions}
                      </div>
                      {!this.state.readonly &&
                          <div id="preconditions-form" className="inplace-form" style={{display: 'none'}}>
                              <form>
                                  <textarea rows="7" className="form-control" name="preconditions" onChange={(e) => this.handleChange("preconditions", e)} value={this.state.testcase.preconditions}></textarea>
                                  <div className="testcase-inplace-buttons-down">
                                      <button type="button" className="btn btn-light" onClick={(e) => this.cancelEdit("preconditions", e)}>Cancel</button>
                                      <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("preconditions", e)}>Save</button>
                                  </div>
                              </form>
                          </div>
                      }
                  </div>

                  <div id="steps" className="testcase-section">
                      <h5>
                          Steps
                      </h5>
                      {
                        (this.state.testcase.steps || []).map(function(step, i){
                            if(!step || (!step.action && !step.expectation)){
                              return (
                                <div className="step" key={i}>
                                    <div id={"steps-" + i + "-form"} index={i} className="inplace-form card">
                                          <div className="card-header">{i + 1}. Step</div>
                                          <div className="card-body">
                                            <p className="card-text">
                                              <textarea rows="5" cols="60" name="step.action" onChange={(e) => this.handleStepActionChange(i, e, false)} value={this.state.testcase.steps[i].action}/>
                                            </p>
                                            <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                                            <p className="card-text">
                                              <textarea rows="5" cols="60" name="step.expectation" onChange={(e) => this.handleStepExpectationChange(i, e, false)} value={this.state.testcase.steps[i].expectation}/>
                                            </p>
                                            <button type="button" className="btn btn-light" onClick={(e) => this.removeStep(e, i)}>Cancel</button>
                                            <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("steps", e, i, true)}>Save</button>
                                          </div>
                                      </div>
                                </div>
                              )
                              } else {
                                return (
                                  <div className="row" key={i}>
                                      <div id={"steps-" + i + "-display"} className="inplace-display col-sm-12">
                                          <div index={i} className="row">
                                              <div className="card col-md-12">
                                                <div className="card-body">
                                                  <p className="card-text">{i + 1}. {this.state.testcase.steps[i].action}</p>
                                                  <h6 className="card-subtitle mb-2 expectations"><b><i>Expectations</i></b></h6>
                                                  <p className="card-text">{this.state.testcase.steps[i].expectation}</p>

                                                  {!this.state.readonly &&
                                                    <a href="#" className="card-link" onClick={(e) => this.toggleEdit("steps", e, i)}>Edit</a>
                                                  }

                                                  {!this.state.readonly &&
                                                  <ConfirmButton onSubmit={this.removeStep}
                                                                 buttonClass={"card-link red float-right"}
                                                                 id={i}
                                                                 modalText={"Are you sure you want to remove Test Step?"}
                                                                 buttonText={"Remove"}/>
                                                  }
                                                </div>
                                              </div>
                                          </div>
                                      </div>
                                      {!this.state.readonly &&
                                          <div id={"steps-" + i + "-form"} index={i} className="inplace-form card col-md-12" style={{display: 'none'}}>
                                              <div className="card-body">
                                                <h6 className="card-subtitle mb-2 text-muted">{i + 1}. Step</h6>
                                                <p className="card-text">
                                                  <textarea rows="5" cols="60" name="step.action" onChange={(e) => this.handleStepActionChange(i, e, true)} value={this.state.testcase.steps[i].action}/>
                                                </p>
                                                <h6 className="card-subtitle mb-2 text-muted">Expectations</h6>
                                                <p className="card-text">
                                                  <textarea rows="5" cols="60" name="step.expectation" onChange={(e) => this.handleStepExpectationChange(i, e, true)} value={this.state.testcase.steps[i].expectation}/>
                                                </p>
                                                <button type="button" className="btn btn-light" onClick={(e) => this.cancelEdit("steps", e, i)}>Cancel</button>
                                                <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("steps", e, i)}>Save</button>
                                              </div>
                                          </div>
                                      }
                                  </div>
                              )}

                          }.bind(this))
                        }
                        {!this.state.readonly &&
                            <div className="row">
                              <button type="button" className="btn btn-primary" onClick={this.addStep}>
                                 Add Step
                              </button>
                            </div>
                        }
                   </div>

                  <div id="attributes" className="testcase-section">
                    <h5>
                        Attributes
                    </h5>
                    {
                      Object.keys(this.state.testcase.attributes || {}).map(function(attributeId, i){
                          var attributeValues = this.state.testcase.attributes[attributeId] || [];
                          if(attributeId && attributeId != "null"){
                            return (
                              <div key={i} className="form-group attribute-block">
                                  <div id={"attributes-" + attributeId + "-display"} className="inplace-display" style={{ display: (this.state.attributesInEdit.has(attributeId) ? 'none' : 'block') }}>
                                    <div index={attributeId} className="card">
                                      <div className="card-header">
                                        <b>{this.getAttributeName(attributeId)}
                                        {!this.state.readonly &&
                                            <span className="edit edit-icon clickable" onClick={(e) => {this.toggleEditAttribute(attributeId)}}><FontAwesomeIcon icon={faPencilAlt}/></span>
                                        }
                                        {!this.state.readonly &&
                                            <span className="clickable edit-icon red" index={attributeId} onClick={(e) => this.removeAttribute(attributeId, e)}>
                                                <FontAwesomeIcon icon={faMinusCircle}/>
                                            </span>
                                        }
                                        </b>
                                      </div>
                                      {
                                          <div className="card-body">{attributeValues.join(", ")}</div>
                                      }

                                    </div>
                                  </div>
                                  {!this.state.readonly &&
                                      <div id={"attributes-" + attributeId + "-form"} className="inplace-form" style={{ display: (this.state.attributesInEdit.has(attributeId) ? 'block' : 'none') }}>
                                        <form>
                                          <div index={attributeId} className="card">
                                            <div className="card-header"><b>{this.getAttributeName(attributeId)}</b></div>
                                            <div className="card-body">
                                                <CreatableSelect value={(attributeValues || []).map(function(val){return {value: val, label: val}})}
                                                  isMulti
                                                  isClearable
                                                  onChange={(e) => this.editAttributeValues(attributeId, e)}
                                                  options={this.getAttributeValues(attributeId).map(function(attrValue){return {value: attrValue.value, label: attrValue.value}})}
                                                 />
                                                <button type="button" className="btn btn-light" onClick={(e) => this.cancelEditAttributeValues(e, attributeId)}>Cancel</button>
                                                <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit("attributes", e, attributeId, true)}>Save</button>
                                              </div>

                                            </div>
                                        </form>
                                      </div>
                                  }
                              </div>
                            )
                            } else {
                              return (
                                <div className="form-group attribute-block">
                                    <div id={"attributes-" + attributeId + "-form"} className="inplace-form">
                                        <div index={attributeId} className="card">
                                            <div className="card-header">
                                                <CreatableSelect
                                                    onChange={(e) => this.editAttributeKey(attributeId, e, true)}
                                                    options={this.getAttributeKeysToAdd()}
                                                />
                                                <button type="button" className="btn btn-light" onClick={(e) => this.cancelEditAttributeKey(e, attributeId)}>Cancel</button>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            )}

                        }.bind(this))
                      }
                      {!this.state.readonly &&
                          <div className="row">
                            <button type="button" className="btn btn-primary" onClick={(e) => this.addAttribute(e)}>
                               Add Attribute
                            </button>
                          </div>
                      }
                  </div>

                  <div id="properties" className="testcase-section">
                      <h5>
                          Properties
                      </h5>
                      {
                        Object.keys(this.state.testcase.properties || {}).map(function(property, i){
                            return(
                                <div key={i} className="attribute-block card">
                                    {this.state.propertiesInEdit.has(i) &&
                                    <form id={"properties-" + i + "-form"} className="inplace-edit">
                                        <div className="form-group card-header">
                                            <input type="text" placeholder="Key" name="key" className="form-control" onChange={(e) => this.handleChange("properties", e, i, "key")} value={this.state.testcase.properties[i].key}/>
                                        </div>
                                        <div className="card-body">
                                            <div className="form-group">
                                                <input type="text" name="value" placeholder="value" className="form-control" onChange={(e) => this.handleChange("properties", e, i, "value")} value={this.state.testcase.properties[i].value}/>
                                            </div>
                                            <div className="form-group">
                                                <button type="button" className="btn btn-success" onClick={(e) => this.handleSubmit("properties", e, i, true)}>Save</button>
                                                <button type="button" className="btn btn-light" onClick={(e) => this.cancelEditProperty(i, e)}>Cancel</button>
                                            </div>
                                        </div>

                                    </form>
                                    }
                                    {!this.state.propertiesInEdit.has(i) &&
                                    <div id={"properties-" + i + "-display"} className="inplace-display card" style={{ display: (this.state.propertiesInEdit.has(i) ? 'none' : 'block') }}>
                                        <div className="card-header">
                                            <b>{this.state.testcase.properties[i].key}
                                                {!this.state.readonly &&
                                                    <span className="edit edit-icon clickable" onClick={(e) => this.toggleEditProperty(e, i)}>
                                                        <FontAwesomeIcon icon={faPencilAlt}/>
                                                    </span>
                                                }
                                                {!this.state.readonly &&
                                                    <span className="clickable edit-icon red" onClick={(e) => this.removeProperty(i, e)}>
                                                        <FontAwesomeIcon icon={faMinusCircle}/>
                                                    </span>
                                                }
                                            </b>
                                        </div>
                                       <div className="card-body">{this.state.testcase.properties[i].value}</div>
                                    </div>
                                    }
                                </div>
                            )
                          }.bind(this))

                       }
                       {!this.state.readonly &&
                            <div className="row">
                              <button type="button" className="btn btn-primary" onClick={(e) => this.addProperty(e)}>
                                 Add Property
                              </button>
                            </div>
                       }
                    </div>
                </div>

                <div className="tab-pane fade show" id="failure" role="tabpanel" aria-labelledby="failure-tab">
                    {this.state.testcase.failureDetails && Object.keys(this.state.testcase.failureDetails).length > 0 &&
                            <div className="testcase-section">
                                <h5>Failure Details</h5>
                                <div>
                                    {this.state.testcase.failureDetails.text}
                                </div>
                            </div>
                     }
                </div>

                <div className="tab-pane fade show" id="attachments" role="tabpanel" aria-labelledby="attachments-tab">
                    <Attachments testcase={this.state.testcase} projectId={this.projectId} onTestcaseUpdated={this.onTestcaseUpdated}/>
                </div>

                <div className="tab-pane fade show" id="issues" role="tabpanel" aria-labelledby="issues-tab">
                    <Issues testcase={this.state.testcase} projectId={this.projectId} entityType="testcase" onTestcaseUpdated={this.onTestcaseUpdated}/>
                </div>

                <div className="tab-pane fade show" id="comments-tab-body" role="tabpanel" aria-labelledby="comments-tab-body">
                    <Comments entityId={this.state.testcase.id} projectId={this.projectId} entityType="testcase" onCommentsNumberChanged={this.onCommentsCountChanged}/>
                </div>

                <div className="tab-pane fade show" id="metadata" role="tabpanel" aria-labelledby="metadata-tab">
                    <dl>
                    {Object.keys(this.state.testcase.metaData || {}).map(
                        function(key){
                            return (
                                <span>
                                <dt>{key}</dt>
                                <dd>{this.state.testcase.metaData[key]}</dd>
                                </span>
                            )
                        }.bind(this)
                    )}
                    </dl>
                </div>

                <div className="tab-pane fade show" id="history" role="tabpanel" aria-labelledby="history-tab">
                    <EventsWidget projectId={this.projectId}
                        filter = {{
                            skip: 0,
                            limit: 10,
                            orderby: "id",
                            orderdir: "DESC",
                            entityType: "TestCase",
                            entityId: this.state.testcase.id,
                            eventType: ["PASSED", "FAILED", "BROKEN", "SKIPPED", "UPDATED"]
                        }}
                    />
                </div>

              </div>

              {!this.state.readonly &&
                <ConfirmButton onSubmit={this.removeTestcase}
                               buttonClass={"btn btn-danger float-right"}
                               id={"testcase-removal"}
                               modalText={"Are you sure you want to remove Test Case?"}
                               buttonText={"Remove Testcase"}/>
              }
            </div>
        );

      }

}

export default withRouter(TestCase);
