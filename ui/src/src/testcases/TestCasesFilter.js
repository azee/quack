/* eslint-disable eqeqeq */
/* eslint-disable react/no-direct-mutation-state */
import React, { Component } from 'react';
import LaunchForm from '../launches/LaunchForm'
import { withRouter } from 'react-router';
import Select from 'react-select';
import qs from 'qs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import $ from 'jquery';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';

class TestCasesFilter extends Component {
    constructor(props) {
        super(props);

        this.defaultFilters = [{
              title: "Select an attribute",
              attrValues: []
        }]

        this.state = {
             groupsToDisplay: [],
             projectAttributes: [],
             createdLaunch: {
                  name: "",
                  testSuite: {filter: {}},
                  properties: []
             },
             testSuite: {
                name: "",
                filter: {
                     groups: [],
                     filters: this.defaultFilters
                 }
             },
             testSuiteNameToDisplay: ""
         };

        this.changeGrouping = this.changeGrouping.bind(this);
        this.getValuesByAttributeId = this.getValuesByAttributeId.bind(this);
        this.changeFilterAttributeId = this.changeFilterAttributeId.bind(this);
        this.changeFilterAttributeValues = this.changeFilterAttributeValues.bind(this);
        this.handleFilter = this.handleFilter.bind(this);
        this.getAttributeName = this.getAttributeName.bind(this);
        this.createLaunchModal = this.createLaunchModal.bind(this);
        this.saveSuite = this.saveSuite.bind(this);
        this.showSuiteModal = this.showSuiteModal.bind(this);
        this.suiteAttrChanged = this.suiteAttrChanged.bind(this);
        this.removeFilter = this.removeFilter.bind(this);
        this.getProjectAttributesSelect = this.getProjectAttributesSelect.bind(this);
    }

    componentWillReceiveProps(nextProps) {
      if (nextProps.projectAttributes){
        this.state.projectAttributes = nextProps.projectAttributes;
        this.state.testSuite.filter.filters.forEach(function(filter){
            filter.name = this.getAttributeName(filter.id);
        }.bind(this))

        this.state.groupsToDisplay.forEach(function(groupToDisplay){
            groupToDisplay.label = this.getAttributeName(groupToDisplay.value);
        }.bind(this))
      }
      this.setState(this.state);
    }

    componentDidMount(){
        var params = qs.parse(this.props.location.search.substring(1));

        if (params.testSuite){
           Backend.get(this.props.match.params.project + "/testsuite/" + params.testSuite)
              .then(response => {
                   this.state.testSuite = response.data;
                   this.state.testSuiteNameToDisplay = this.state.testSuite.name;
                   this.state.groupsToDisplay = this.state.testSuite.filter.groups.map(function(attrId){
                       return {value: attrId, label:this.getAttributeName(attrId)};
                   }.bind(this))
                   this.setState(this.state);
                   this.props.onFilter(this.state.testSuite.filter);
              })
              .catch(error => {Utils.onErrorMessage("Couldn't fetch testsuite: ", error)});
        } else {
            if (params.groups){
                if(!Array.isArray(params.groups)){
                    params.groups = [params.groups];
                }
                this.state.testSuite.filter.groups = params.groups;
                this.state.groupsToDisplay = params.groups.map(function(attrId){
                    return {value: attrId, label:this.getAttributeName(attrId)};
                }.bind(this))
            }
            if (params.attribute){
                if(!Array.isArray(params.attribute)){
                    params.attribute = [params.attribute];
                }
                var map = {}
                params.attribute.forEach(function(pair){
                    var key = pair.split(":")[0];
                    var value = pair.split(":")[1];
                    if (!map[key]){
                        map[key] = [];
                    }
                    map[key].push(value);
                })

                Object.keys(map).forEach(function(key) {
                    this.state.testSuite.filter.filters.push({
                        id: key,
                        attrValues: map[key].map((val) => ({value: val})),
                        title: this.getAttributeName(key)

                    });
                }.bind(this))

                if (!this.state.testSuite.filter.filters[0].id){
                    var emptyFilter = this.state.testSuite.filter.filters[0];
                    this.state.testSuite.filter.filters.push(emptyFilter);
                    this.state.testSuite.filter.filters.shift();
                }

            }
            this.setState(this.state);
            this.props.onFilter(this.state.testSuite.filter);
        }

    }

    changeFilterAttributeId(index, formValue){
        var oldId = this.state.testSuite.filter.filters[index].id;
        this.state.testSuite.filter.filters[index].id = formValue.value;
        this.state.testSuite.filter.filters[index].name = formValue.label;
        if (oldId !== formValue.value){
            this.state.testSuite.filter.filters[index].attrValues = [];
        }
        if (!oldId){
            this.state.testSuite.filter.filters.push({
                id: null,
                title: "Select an attribute",
                attrValues: []
            })
        }

        this.setState(this.state);
    }

    changeFilterAttributeValues(index, formValues){
        this.state.testSuite.filter.filters[index].attrValues = formValues.map(function(formSingleVal){return {value: formSingleVal.value}});
        this.setState(this.state);
    }

    changeGrouping(values){
        this.state.testSuite.filter.groups = values.map(function(value){return value.value});
        this.state.groupsToDisplay = values;
        this.setState(this.state);
    }

    getValuesByAttributeId(id){
        if(!id) return [];
        if (id == "broken"){
            return [{value: "true"}, {value: "false"}];
        }
        return (this.state.projectAttributes.find(function(attribute){return attribute.id === id}) || {attrValues: []}).attrValues;
    }

    handleFilter(){
        this.props.onFilter(this.state.testSuite.filter);
    }

    getAttributeName(id){
        return (this.state.projectAttributes.find(function(attribute){return attribute.id === id}) || {attrValues: []}).name;
    }

    createLaunchModal(){
        this.state.createdLaunch = {
             name: "",
             testSuite: {filter: {}},
             properties: []
        }
        this.setState(this.state);
        $("#launch-modal").modal('toggle');
    }

    saveSuite(event){
        var suiteToSave = JSON.parse(JSON.stringify(this.state.testSuite));
        (suiteToSave.filter.filters || []).filter(function(filter){return filter.id}).forEach(function(filter){
            delete filter.title;
        })
        Backend.post(this.props.match.params.project + '/testsuite/', suiteToSave)
            .then(response => {
                this.state.testSuite = response.data;
                this.state.testSuiteNameToDisplay = this.state.testSuite.name;
                this.setState(this.state);
                $("#suite-modal").modal('toggle');
                this.props.history.push('/' + this.props.match.params.project + '/testcases?testSuite=' + this.state.testSuite.id)
            }).catch(error => {Utils.onErrorMessage("Couldn't save testsuite: ", error)});
        event.preventDefault();
    }

    showSuiteModal(){
        $("#suite-modal").modal('toggle');
    }

    suiteAttrChanged(event){
        this.state.testSuite[event.target.name] = event.target.value;
        this.setState(this.state);
    }

    removeFilter(i, event){
        this.state.testSuite.filter.filters.splice(i, 1);
        this.setState(this.state);
    }

    getProjectAttributesSelect(){
        var projectAttributes = this.state.projectAttributes.map(function(val){return {value: val.id, label: val.name}});
        return projectAttributes;
    }

    render() {
        return (
            <div>
                <h2>{this.state.testSuiteNameToDisplay}</h2>
                <div>
                    <div className="row filter-control-row">
                        <div className="col-1">Grouping</div>
                        <div className="col-5 grouping-control">
                            <Select value={this.state.groupsToDisplay}
                                    isMulti
                                    onChange={this.changeGrouping}
                                    options={this.getProjectAttributesSelect().filter((attr) => attr.value != 'broken' )}
                                   />
                        </div>
                        <div className="col-2"></div>
                        <div className="col-4 btn-group" role="group" >
                            <button type="button" className="btn btn-primary" onClick={this.handleFilter}>Filter</button>
                            <button type="button" className="btn btn-warning" onClick={this.showSuiteModal}>Save</button>
                            <button type="button" className="btn btn-success" onClick={this.createLaunchModal}>Launch</button>
                             <button type="button" className="btn btn-primary" data-toggle="modal" data-target="#editTestcase">
                                Add Test Case
                             </button>
                        </div>
                    </div>
                    <div className="row filter-control-row">
                        <div className="col-1">Filter</div>
                            {
                                this.state.testSuite.filter.filters.map(function(filter, i){
                                    return(
                                    <div className="col-5" key={i}>
                                        <div className="row">
                                            <Select className="col-5 filter-attribute-id-select" value={{value: filter.id, label: filter.name}}
                                                    onChange={(e) => this.changeFilterAttributeId(i, e)}
                                                    options={this.getProjectAttributesSelect()}
                                                   />
                                            <Select className="col-6 filter-attribute-val-select" value={filter.attrValues.map(function(attrValue){return {value: attrValue.value, label: attrValue.value}})}
                                                    isMulti
                                                    onChange={(e) => this.changeFilterAttributeValues(i, e)}
                                                    options={this.getValuesByAttributeId(filter.id).map(function(attrValue){return {value: attrValue.value, label: attrValue.value}})}
                                                   />
                                            {filter.id &&
                                                <span className='col-1 remove-filter-icon clickable red' index={i} onClick={(e) => this.removeFilter(i, e)}>
                                                    <FontAwesomeIcon icon={faMinusCircle}/>
                                                 </span>
                                            }
                                        </div>
                                    </div>
                                    )
                                }.bind(this))

                            }

                    </div>
                </div>
                <div className="modal fade" id="launch-modal" tabIndex="-1" role="dialog" aria-labelledby="launchLabel" aria-hidden="true">
                    <LaunchForm launch={this.state.createdLaunch} testSuite={this.state.testSuite}/>
                </div>

                <div className="modal fade" id="suite-modal" tabIndex="-1" role="dialog" aria-labelledby="suiteLabel" aria-hidden="true">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title" id="editAttributeLabel">Test Suite</h5>
                            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>

                          <div>
                            <div className="modal-body" id="suite-save-form">
                                <form>
                                    <div className="form-group row">
                                        <label className="col-sm-3 col-form-label">Name</label>
                                        <div className="col-sm-9">
                                            <input type="text" name="name" className="form-control" onChange={this.suiteAttrChanged} defaultValue={this.state.testSuiteNameToDisplay}/>
                                        </div>
                                    </div>
                                </form>
                            </div>
                          </div>

                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                            <button type="button" className="btn btn-primary" onClick={this.saveSuite}>Save</button>
                          </div>
                        </div>
                     </div>
                </div>


            </div>
        );
      }


}

export default withRouter(TestCasesFilter);
