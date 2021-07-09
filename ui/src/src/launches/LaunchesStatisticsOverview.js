import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent'
import LaunchesTrendWidget from '../launches/LaunchesTrendWidget'
import LaunchesByStatusesPieWidget from '../launches/LaunchesByStatusesPieWidget'
import LaunchesByUsersPieWidget from '../launches/LaunchesByUsersPieWidget'
import { FadeLoader } from 'react-spinners';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';

class LaunchesStatisticsOverview extends SubComponent {

    state = {
        stats: {
            all: {
                launchTimes: {}
            }
        },
        loading: true
    };

    constructor(props) {
        super(props);
        this.state.projectId = this.props.match.params.project;
        this.getStats = this.getStats.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        this.state.projectId = this.props.match.params.project;
        this.getStats();
    }

    getStats(){
        Backend.get(this.state.projectId + "/launch/statistics" + this.props.location.search)
            .then(response => {
                 this.state.stats = response.data;
                 this.state.loading = false;
                 this.setState(this.state);
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get launch statistics: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    render() {
        return (
        <div>
          <div className='sweet-loading'>
             <FadeLoader
               sizeUnit={"px"}
               size={100}
               color={'#135f38'}
               loading={this.state.loading}
             />
          </div>
          <div className="row">
              <div className="col-6">
                <table class="table">
                  <tbody>
                    <tr>
                      <td>Total Launches: {this.state.stats.all.launchCount || 0}</td>
                      <td>Total Duration: {Utils.timePassed(this.state.stats.all.launchTimes.duration || 0)}</td>
                      <td>Idle Time: {Utils.timePassed(this.state.stats.all.launchTimes.idle || 0)}</td>
                    </tr>
                    <tr>
                      <td>First Started: {Utils.timeToDate(this.state.stats.all.launchTimes.firstStart || 0)}</td>
                      <td>Last Finished: {Utils.timeToDate(this.state.stats.all.launchTimes.lastFinish || 0)}</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
          </div>
          <div className="row">
            <div className="col-6">
                <LaunchesByStatusesPieWidget projectId={this.state.projectId}
                        filter={Utils.queryToFilter(this.props.location.search.substring(1))} />
            </div>
            <div className="col-6">
                <LaunchesByUsersPieWidget projectId={this.state.projectId}
                        filter={Utils.queryToFilter(this.props.location.search.substring(1))} />
            </div>
          </div>
          <div className="row">
            <div className="col-6">
                <LaunchesTrendWidget projectId={this.state.projectId}
                    filter={Utils.queryToFilter(this.props.location.search.substring(1))}/>
            </div>
          </div>
        </div>
        );
      }

}

export default withRouter(LaunchesStatisticsOverview);
