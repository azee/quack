/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import Pager from '../pager/Pager';
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlug } from '@fortawesome/free-solid-svg-icons'
import Backend from '../services/backend';

import DatePicker from 'react-date-picker';

class Launches extends SubComponent {

    state = {
        launches: [],
        filter: {
            skip: 0,
            limit: 20,
            orderby: "id",
            orderdir: "DESC",
            includedFields: "name,launchStats,id,createdTime,startTime,finishTime,launcherConfig"
        },
        pager: {
            total: 0,
            current: 0,
            maxVisiblePage: 7,
            itemsOnPage: 20
        },
        launcherDescriptors: [],
        loading: true
    };

    constructor(props) {
        super(props);
        this.getLaunches = this.getLaunches.bind(this);
        this.getPager = this.getPager.bind(this);
        this.handlePageChanged = this.handlePageChanged.bind(this);
        this.updateUrl = this.updateUrl.bind(this);
        this.onFilter = this.onFilter.bind(this);
        this.handleFilterChange = this.handleFilterChange.bind(this);
        this.handleFromDateFilterChange = this.handleFromDateFilterChange.bind(this);
        this.handleToDateFilterChange = this.handleToDateFilterChange.bind(this);
        this.getLauncherDescriptors = this.getLauncherDescriptors.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        this.state.filter = Object.assign(this.state.filter,
            Utils.queryToFilter(this.props.location.search.substring(1))
        );
        this.getLaunches();
        this.getPager();
        this.getLauncherDescriptors();
        this.intervalId = setInterval(this.getLaunches, 30000);
    }

    handlePageChanged(newPage) {
        this.state.pager.current = newPage;
        this.state.filter.skip = newPage * this.state.pager.itemsOnPage;
        this.getLaunches();
        this.setState(this.state);
        this.updateUrl();
    }

    getLaunches(){
        Backend.get(this.props.match.params.project + "/launch?" + Utils.filterToQuery(this.state.filter))
            .then(response => {
                 this.state.launches = response.data;
                 this.state.loading = false;
                 this.setState(this.state);
        }).catch(error => {
            Utils.onErrorMessage("Couldn't get launches: ", error);
            this.state.loading = false;
            this.setState(this.state);
        });
    }

    getPager(){
        var countFilter = Object.assign({skip:0, limit:0}, this.state.filter);
        Backend.get(this.props.match.params.project + "/launch/count?" + Utils.filterToQuery(countFilter))
            .then(response => {
                 this.state.pager.total = response.data;
                 this.state.pager.current = this.state.filter.skip / this.state.filter.limit;
                 this.state.pager.visiblePage = Math.min(response.data / this.state.pager.itemsOnPage + 1, this.state.pager.maxVisiblePage);
                 this.setState(this.state);
        }).catch(error => console.log(error));
    }

    getLauncherDescriptors(){
        Backend.get("launcher/descriptors")
            .then(response => {
              this.state.launcherDescriptors = response.data;
              this.setState(this.state);
            }).catch(error => {Utils.onErrorMessage("Couldn't get launcher descriptors: ", error)});
    }

    handleFilterChange(fieldName, event, index){
        if (index){
            if (event.target.value == ""){
                delete this.state.filter[fieldName][index];
            } else {
                this.state.filter[fieldName][index] = event.target.value;
            }
        } else {
            if (event.target.value == ""){
                delete this.state.filter[fieldName];
            } else {
                this.state.filter[fieldName] = event.target.value;
            }
        }
        this.setState(this.state);
    }

    handleFromDateFilterChange(value, formattedValue){
        if (value == null){
            delete this.state.filter.from_createdTime;
        } else {
            this.state.filter.from_createdTime = value.getTime();
        }
        this.setState(this.state);
    }

    handleToDateFilterChange(value, formattedValue){
        if (value == null){
            delete this.state.filter.to_createdTime;
        } else {
            this.state.filter.to_createdTime = value.getTime();
        }
        this.setState(this.state);
    }

    onFilter(event){
        this.updateUrl();
        this.getLaunches();
        this.getPager();
        event.preventDefault();
    }

    updateUrl(){
        this.props.history.push("/" + this.props.match.params.project + '/launches?' + Utils.filterToQuery(this.state.filter));
    }

    getProgressBar(launch){
        return (
            <div class="progress">
              <div class="progress-bar progress-bar-striped" role="progressbar" style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.RUNNING, launch.launchStats.total)}></div>
              <div class="progress-bar bg-success" role="progressbar" style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.PASSED, launch.launchStats.total)}></div>
              <div class="progress-bar bg-danger" role="progressbar" style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.FAILED, launch.launchStats.total)}></div>
              <div class="progress-bar bg-warning" role="progressbar" style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.BROKEN, launch.launchStats.total)}></div>
              <div class="progress-bar progress-bar-striped bg-warning" role="progressbar" style={Utils.getProgressBarStyle(launch.launchStats.statusCounters.SKIPPED, launch.launchStats.total)}></div>
            </div>
        )
    }

    render() {
        return (
            <div className="row">
              <div className="col-sm-3 launch-filter">
                <form>
                  <div class="form-group">
                    <span className="float-right">
                        <Link to={'/' + this.props.match.params.project + '/launches/statistics?' + Utils.filterToQuery(this.state.filter)}>
                            Statistics
                        </Link>
                    </span>
                    <label for="title"><h5>Launch Name</h5></label>
                    <input type="text" class="form-control" id="name" name="name" aria-describedby="Launch title" placeholder="Launch title"
                        value={this.state.filter.like_name || ""} onChange={(e) => this.handleFilterChange("like_name", e)} />
                    <small id="titleHelp" class="form-text text-muted">Find by partly matching Launch title</small>
                  </div>
                  <div class="form-group">
                    <label for="created"><h5>Created Time</h5></label>
                    <div class="input-group mb-2">
                      <DatePicker id="from_createdTime" value={Utils.getDatepickerTime(this.state.filter.from_createdTime)}
                                onChange={this.handleFromDateFilterChange} placeholder="Created after" />
                      <DatePicker id="to_createdTime" value={Utils.getDatepickerTime(this.state.filter.to_createdTime)}
                                onChange={this.handleToDateFilterChange}  placeholder="Created before"/>
                    </div>
                  </div>
                  <div class="form-group">
                      <label for="created"><h5>Launcher</h5></label>
                      <div class="input-group mb-2">
                          <select id="launcher-select" className="form-control" onChange={(e) => this.handleFilterChange("launcherConfig.launcherId", e)}>
                              <option> </option>
                              {
                                  this.state.launcherDescriptors.map(function(descriptor){
                                      var selected = this.state.filter["launcherConfig.launcherId"] == descriptor.launcherId;
                                      if (selected){
                                          return (<option value={descriptor.launcherId} selected>{descriptor.name}</option>)
                                      }
                                      return (<option value={descriptor.launcherId} >{descriptor.name}</option>)

                                  }.bind(this))
                              }
                          </select>
                      </div>
                  </div>
                  <button type="submit" class="btn btn-primary"  onClick={this.onFilter}>Filter</button>
                </form>
              </div>
              <div className="col-sm-9">
                  <div className='sweet-loading'>
                         <FadeLoader
                           sizeUnit={"px"}
                           size={100}
                           color={'#135f38'}
                           loading={this.state.loading}
                         />
                   </div>
                  <table class="table table-striped">
                      <thead>
                          <tr>
                            <th scope="col">Title</th>
                            <th scope="col">Progress</th>
                            <th scope="col">Created</th>
                            <th scope="col">Started</th>
                            <th scope="col">Finished</th>
                            <th></th>
                          </tr>
                      </thead>
                      <tbody>
                      {
                            this.state.launches.map(function(launch){
                                return (
                                       <tr>
                                           <td>
                                                <Link to={'/' + this.props.match.params.project + '/launch/' + launch.id}>
                                                    {launch.name}
                                                </Link>
                                           </td>
                                           <td>{this.getProgressBar(launch)}</td>
                                           <td>{Utils.timeToDate(launch.createdTime)}</td>
                                           <td>{Utils.timeToDate(launch.startTime)}</td>
                                           <td>{Utils.timeToDate(launch.finishTime)}</td>
                                           <td>
                                                {launch.launcherConfig && launch.launcherConfig.launcherId &&
                                                    <FontAwesomeIcon icon={faPlug}/>
                                                }
                                           </td>
                                       </tr>
                                       );
                            }.bind(this))
                      }
                      </tbody>
                  </table>
                  <div>
                      <Pager
                          totalItems={this.state.pager.total}
                          currentPage={this.state.pager.current}
                          visiblePages={this.state.pager.maxVisiblePage}
                          itemsOnPage={this.state.pager.itemsOnPage}
                          onPageChanged={this.handlePageChanged}
                      />
                  </div>
              </div>
            </div>

        );
      }

}

export default Launches;
