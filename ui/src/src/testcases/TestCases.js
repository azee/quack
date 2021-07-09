/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import TestCaseForm from '../testcases/TestCaseForm'
import TestCasesFilter from '../testcases/TestCasesFilter'
import TestCase from '../testcases/TestCase'
import $ from 'jquery';
import qs from 'qs';
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';

var jQuery = require('jquery');
window.jQuery = jQuery;
window.jQuery = $;
window.$ = $;
global.jQuery = $;

require('gijgo/js/gijgo.min.js');
require('gijgo/css/gijgo.min.css');

class TestCases extends SubComponent {

    defaultTestcase = {
        id: null,
        name: "",
        description: "",
        steps: [],
        attributes: {}
    };

    testCasesFetchLimit = 50;

    state = {
        testcasesTree: {children: []},
        testcaseToEdit: Object.assign({}, this.defaultTestcase, {attributes: {}, steps: []}),
        projectAttributes: [],
        selectedTestCase: {},
        filter: {
            includedFields: "id,name,attributes,importedName,automated"
        },
        loading: true
    };

    constructor(props) {
        super(props);
        this.onFilter = this.onFilter.bind(this);
        this.refreshTree = this.refreshTree.bind(this);
        this.getQueryParams = this.getQueryParams.bind(this);
        this.getFilterQParams = this.getFilterQParams.bind(this);
        this.getGroupingQParams = this.getGroupingQParams.bind(this);
        this.onTestcaseSelected = this.onTestcaseSelected.bind(this);
        this.onTestCaseAdded = this.onTestCaseAdded.bind(this);
        this.loadMoreTestCases = this.loadMoreTestCases.bind(this);
        this.showLoadMore = this.showLoadMore.bind(this);
        this.updateCount = this.updateCount.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        var params = qs.parse(this.props.location.search.substring(1));
        if (params.testcase){
            this.state.selectedTestCase = {id: params.testcase};
            this.setState(this.state);
        }
        if (params.testSuite){
            this.state.testSuite = {
                id: params.testSuite
            }
            this.setState(this.state);
        }
       Backend.get(this.props.match.params.project + "/attribute")
          .then(response => {
               this.state.projectAttributes = response.data.sort((a, b) => (a.name || "").localeCompare(b.name));
               this.state.projectAttributes.unshift({
                    id: 'broken',
                    name: 'Broken',
                    values: ['True', 'False']
               });
               this.setState(this.state);
               this.refreshTree();
          })
          .catch(error => {Utils.onErrorMessage("Couldn't fetch attributes: ", error)});
     }

     editTestcase(testcaseId){
        this.state.testcaseToEdit = this.state.testcases.find(function(testcase){
            return testcaseId === testcase.id
        }) || {};
        this.setState(this.state);
        $("#editTestcase").modal('toggle');
     }


     onTestCaseAdded(testcase){
        this.state.testcaseToEdit = Object.assign({}, this.defaultTestcase, {attributes: {}, steps: []});
        this.onFilter(this.state.filter, function(){this.onTestcaseSelected(testcase.id); this.refreshTree();}.bind(this));
        $('#editTestcase').modal('hide');
     }

     onFilter(filter, onResponse){
        var params = qs.parse(this.props.location.search.substring(1));
        if (params.testcase){
            this.state.selectedTestCase = {id: params.testcase};
        }

        if (!filter.groups || filter.groups.length == 0){
            filter.skip = filter.skip || 0;
            filter.limit = this.testCasesFetchLimit;
        }
        filter.includedFields = filter.includedFields || [];
        filter.includedFields.push('name');
        filter.includedFields.push('id');
        filter.includedFields.push('attributes');

        this.state.filter = filter;
        this.state.loading = true;
        this.setState(this.state);
       Backend.get(this.props.match.params.project + "/testcase/tree?" + this.getFilterApiRequestParams(filter))
          .then(response => {
            this.state.testcasesTree = response.data;
            this.state.loading = false;
            this.setState(this.state);
            this.refreshTree();
            if (onResponse){
                onResponse();
            }
            this.updateCount();
          })
          .catch(error => {
                Utils.onErrorMessage("Couldn't fetch testcases tree: ", error);
                this.state.loading = false;
                this.setState(this.state);
           });
          if (!params.testSuite){
            this.props.history.push("/" + this.props.match.params.project + '/testcases?' + this.getQueryParams(filter));
          }
     }

     updateCount(){
       Backend.get(this.props.match.params.project + "/testcase/count?" + this.getFilterApiRequestParams(this.state.filter))
            .then(response => {
              this.state.count = response.data;
              this.setState(this.state);
            })
            .catch(error => {Utils.onErrorMessage("Couldn't fetch testcases number: ", error)});
     }

     loadMoreTestCases(event){
        this.state.filter.skip = (this.state.filter.skip || 0) + this.testCasesFetchLimit;
       Backend.get(this.props.match.params.project + "/testcase?" + this.getFilterApiRequestParams(this.state.filter))
          .then(response => {
            if (response.data){
                this.state.testcasesTree.testCases = this.state.testcasesTree.testCases.concat(response.data);
                this.setState(this.state);
                this.refreshTree();
            } else {
                this.state.filter.skip = (this.state.filter.skip || 0) - this.testCasesFetchLimit;
                this.setState(this.state);
            }
          })
          .catch(error => {Utils.onErrorMessage("Couldn't fetch testcases: ", error)});
          event.preventDefault();
     }

     getFilterApiRequestParams(filter){
         var tokens = (filter.groups || []).map(function(group){return "groups=" + group});
         filter.filters.forEach(function(filter){
             filter.attrValues.forEach(function(attrValue){
                 if (filter.id == "broken" && attrValue.value && attrValue.value != ''){
                    tokens.push(filter.id + "=" + attrValue.value);
                 } else {
                    tokens.push("attributes." + filter.id + "=" + attrValue.value);
                 }
             })
         });

         if ((filter.groups || []).length > 0){
            filter.skip = 0;
            filter.limit = 0;
         }
         if(filter.skip){
            tokens.push("skip=" + filter.skip);
         }
         if (filter.limit){
            tokens.push("limit=" + filter.limit);
         }
         return tokens.join("&");
     }

     onTestcaseSelected(id){
        this.state.selectedTestCase = Utils.getTestCaseFromTree(id, this.state.testcasesTree, function(testCase, id){return testCase.id === id});
        this.props.history.push("/" + this.props.match.params.project + '/testcases?' + this.getQueryParams(this.state.filter));
        this.setState(this.state);
     }

     refreshTree(){
        if (this.tree){
            this.tree.destroy()
        }
        this.tree = $("#tree").tree({
            primaryKey: 'id',
            uiLibrary: 'bootstrap4',
            dataSource: Utils.parseTree(this.state.testcasesTree)
        });
        this.tree.on('select', function (e, node, id) {
            this.onTestcaseSelected(id);
        }.bind(this));
        if (this.state.selectedTestCase.id){
            var node = this.tree.getNodeById(this.state.selectedTestCase.id);
            if (!node) return;
            this.tree.select(node);
            this.state.filter.groups.forEach(function(groupId){
                var attributes = Utils.getTestCaseFromTree(this.state.selectedTestCase.id, this.state.testcasesTree, function(testCase, id){return testCase.id === id}).attributes || {};
                var values = attributes[groupId] || ["None"] ;
                values.forEach(function(value){
                    var node = this.tree.getNodeById(groupId + ":" + value);
                    this.tree.expand(node);
                }.bind(this))

            }.bind(this))
        }

     }

     getQueryParams(filter){
        var testcaseIdAttr = "";
        if (this.state.selectedTestCase && this.state.selectedTestCase.id){
            testcaseIdAttr = "testcase=" + this.state.selectedTestCase.id;
        }
        var urlParts = [this.getFilterQParams(filter), this.getGroupingQParams(filter), testcaseIdAttr];
        if (this.state.testSuite){
            urlParts.push("testSuite=" + this.state.testSuite.id);
        }
        return urlParts.filter(function(val){return val !== ""}).join("&");
     }

    getFilterQParams(filter){
        var activeFilters = filter.filters.filter(function(filter){return filter.id}) || [];
        var attributesPairs = [];
        activeFilters.forEach(function(filter){
            var tokens = filter.attrValues.map(function(attrValue){
                return "attribute=" + filter.id + ":" + attrValue.value
            })
            attributesPairs = attributesPairs.concat(tokens);
        })

        return attributesPairs.join("&") || "";
    }

    getGroupingQParams(filter){
        return filter.groups.map(function(group){return "groups=" + group}).join("&") || "";
    }

    showLoadMore(){
        if (((this.state.filter || {}).groups || []).length > 0 || !this.state.count) {
            return false
        }
        return ((this.state.filter || {}).skip || 0) + this.testCasesFetchLimit <= this.state.count;
    }

    render() {

        return (
            <div>
              <div>
                <TestCasesFilter projectAttributes={this.state.projectAttributes}
                        onFilter={this.onFilter} project={this.props.match.params.project}/>
              </div>

              <div>

                  <div className="modal fade" id="editTestcase" tabIndex="-1" role="dialog" aria-labelledby="editTestcaseLabel" aria-hidden="true">
                      <TestCaseForm project={this.props.match.params.project}
                              testcase={this.state.testcaseToEdit}
                              projectAttributes={this.state.projectAttributes}
                              onTestCaseAdded={this.onTestCaseAdded}/>
                  </div>
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
                    {this.showLoadMore() && <div><a href="" onClick={this.loadMoreTestCases}>Load more</a></div>}
                </div>
                <div id="testCase" className="testcase-side col-7">
                    {this.state.selectedTestCase && this.state.selectedTestCase.id &&
                        <TestCase projectId={this.props.match.params.project} projectAttributes={this.state.projectAttributes}
                                testcaseId={this.state.selectedTestCase.id}/>
                    }
                </div>
              </div>



            </div>
        );
      }

}

export default TestCases;
