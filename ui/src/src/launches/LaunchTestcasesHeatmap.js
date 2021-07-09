/* eslint-disable eqeqeq */
import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import { FadeLoader } from 'react-spinners';
import * as Utils from '../common/Utils';
import { Checkbox } from 'semantic-ui-react'
import Backend from '../services/backend';

class LaunchTestcasesHeatmap extends SubComponent {

    state = {
        heatmap: [],
        loading: true
    };

    constructor(props) {
        super(props);
        this.state.projectId = this.props.match.params.project;
        this.getHeatMap = this.getHeatMap.bind(this);
        this.updateTestcase = this.updateTestcase.bind(this);
        this.onBrokenToggle = this.onBrokenToggle.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        this.state.projectId = this.props.match.params.project;
        this.getHeatMap();
    }

    getHeatMap(){
        Backend.get(this.state.projectId + "/launch/heatmap" + this.props.location.search``)
            .then(response => {
                 this.state.heatmap = response.data;
                 this.state.loading = false;
                 this.setState(this.state);
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get launch testcases heatmap: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    getPercentile(testcase){
        if (testcase.total == 0){
            return 0;
        }
        return Utils.intDiv((testcase.statusCounters.FAILED + testcase.statusCounters.BROKEN) * 100, testcase.total);
    }

    getCellColorClass(testcase){
        var failedPercent = this.getPercentile(testcase);
        if (failedPercent > 33){
            return Utils.getStatusColorClass("FAILED");
        }
        if (failedPercent <= 33 && failedPercent > 0){
            return Utils.getStatusColorClass("BROKEN");
        }
        return Utils.getStatusColorClass("PASSED");
    }

    onBrokenToggle(id, value, event){
        var testcaseToUpdate;
        Backend.get(this.state.projectId + "/testcase/"+ id)
          .then(response => {
             testcaseToUpdate = response.data;
             if (testcaseToUpdate){
                testcaseToUpdate.broken = value;
                this.updateTestcase(testcaseToUpdate);
             }
          })
          .catch(error => {
            Utils.onErrorMessage("Couldn't update testcase status: ", error);
          });
    }

    updateTestcase(testcaseToUpdate){
        Backend.put(this.state.projectId + '/testcase/', testcaseToUpdate)
                .then(response => {
                    var foundTestcaseStats = this.state.heatmap.find((testcaseStats) => testcaseStats.id == testcaseToUpdate.id);
                    if (foundTestcaseStats){
                        foundTestcaseStats.broken = response.data.broken;
                    }
                    this.setState(this.state);

            }).catch(error => {Utils.onErrorMessage("Couldn't update testcase status: ", error)});
    }

    render() {
        return (
        <div>
          <table class="table">
            <thead>
                <tr>
                  <th scope="col">Title</th>
                  <th scope="col" className='center-text'>Failures</th>
                  <th scope="col">Active</th>
                </tr>
            </thead>
            <tbody>
            {
              this.state.heatmap.map(function(testcase){
                  return (
                         <tr>
                             <td>
                                  <Link to={'/' + this.props.match.params.project + '/testcase/' + testcase.id}>
                                      {testcase.name}
                                  </Link>
                             </td>
                             <td className={this.getCellColorClass(testcase) + ' center-text'}>{this.getPercentile(testcase)}%</td>
                             <td>
                                <Checkbox toggle onClick={(e) => this.onBrokenToggle(testcase.id, !testcase.broken, e)} checked={!testcase.broken} label={{ children: testcase.broken? 'Off' : 'On' }} />
                             </td>
                         </tr>
                         );
              }.bind(this))
            }
            </tbody>
          </table>
          <div className='sweet-loading'>
             <FadeLoader
               sizeUnit={"px"}
               size={100}
               color={'#135f38'}
               loading={this.state.loading}
             />
           </div>
        </div>
        );
      }

}

export default withRouter(LaunchTestcasesHeatmap);
