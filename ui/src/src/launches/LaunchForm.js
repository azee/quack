/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import { withRouter } from 'react-router';
import CreatableSelect from 'react-select/lib/Creatable';
import LauncherForm from '../launches/LauncherForm';
import $ from 'jquery';
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';

class LaunchForm extends SubComponent {
    constructor(props) {
        super(props);
        this.state = {
             launch: {
                 name: "",
                 testSuite: {filter: {}},
                 properties: [],
                 launcherConfig: {properties: {}}
             },
             project: {
                  id: null,
                  name: "",
                  description: "",
                  allowedGroups: [],
                  launcherConfigs: []
              },
             launcherDescriptors: [],
             restart: props.restart || false,
             failedOnly: props.failedOnly || false,
             loading: false
         };

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.changeEnvironments = this.changeEnvironments.bind(this);
        this.handleLauncherChange = this.handleLauncherChange.bind(this);
      }

      handleChange(event) {
        this.state.launch[event.target.name] = event.target.value;
        this.setState(this.state);
      }

      handleSubmit(event) {
        this.state.loading = true;
        this.setState(this.state);
        this.state.launch.testSuite.filter.filters = (this.state.launch.testSuite.filter.filters || [])
            .filter(function(filter){return filter.id !== undefined && filter.id !== null});
        this.state.launch.testSuite.filter.filters.forEach(function(filter){
            delete filter.title;
        })
        var url = this.props.match.params.project + '/launch/';
        if (this.state.restart){
            url = this.props.match.params.project + '/launch/' + this.state.launch.id + '/restart';
            if (this.state.failedOnly){
                url += '?failedOnly=true';
            }
        }
        Backend.post(url, this.state.launch)
        .then(response => {
            this.state.launch = response.data;
            if (!this.state.launch.id){
                this.state.launch.triggeredByLauncher = true;
            }
            this.state.restart = false;
            this.state.loading = false;
            this.setState(this.state);
        }).catch(error => {
            this.state.loading = false;
            this.setState(this.state);
            Utils.onErrorMessage("Couldn't save launch: ", error);
        });
        event.preventDefault();
      }

    componentWillReceiveProps(nextProps) {
      this.state.restart = nextProps.restart || false;
      this.state.failedOnly = nextProps.failedOnly || false;
      if(nextProps.testSuite){
          this.state.launch.testSuite = nextProps.testSuite;
      }
      if(nextProps.launch && nextProps.launch.id){
          this.state.launch = nextProps.launch;
      }
      this.setState(this.state);
    }

    componentDidMount() {
        super.componentDidMount();

        Backend.get("project/" + this.props.match.params.project)
          .then(response => {
            this.state.project = response.data;
            this.setState(this.state);
          }).catch(error => {Utils.onErrorMessage("Couldn't get project: ", error)});

        Backend.get("launcher/descriptors")
            .then(response => {
              this.state.launcherDescriptors = response.data;
              this.setState(this.state);
            }).catch(error => {Utils.onErrorMessage("Couldn't get launcher descriptors: ", error)});
    }

    handleLauncherChange(event, index, propertyKey){
       if(propertyKey == 'uuid'){
            this.state.launch.launcherConfig = this.state.project.launcherConfigs.find(config => config.uuid == event.target.value) || {};
        } else {
            this.state.launch.launcherConfig.properties[propertyKey] = event.target.value;
        }
        this.setState(this.state);
    }

    changeEnvironments(values){
        this.state.launch.environments = values.map(function(value){return value.value});
        this.setState(this.state);
    }

    launchModalDismiss(){
        $("#launch-modal").modal("hide");
    }

    render() {
        let modalBody;
        if (this.state.launch.id && !this.state.restart && !this.state.launch.launchGroup){
            modalBody = <div className="modal-body" id="launch-created">
                            <Link onClick={this.launchModalDismiss} to={'/' + this.props.match.params.project + '/launch/' + this.state.launch.id} className='dropdown-item'>Go To Launch</Link>
                        </div>
        } else if (this.state.launch.id && !this.state.restart && this.state.launch.launchGroup){
           modalBody = <div className="modal-body" id="launch-created">
                           <Link onClick={this.launchModalDismiss} to={'/' + this.props.match.params.project + '/launches?launchGroup=' + this.state.launch.launchGroup} className='dropdown-item'>Go To Launch Group</Link>
                       </div>
        } else if (this.state.launch.triggeredByLauncher && !this.state.restart) {
            modalBody = <div className="modal-body" id="launch-created">
                                        Launch was triggered using {this.state.launch.launcherConfig.name}
                                    </div>
        } else {
            modalBody =
                <div className="modal-body" id="launch-creation-form">
                    <form>
                        <div className="form-group row">
                            <label className="col-4 col-form-label">Name</label>
                            <div className="col-8">
                                <input type="text" className="form-control" name="name" value={this.state.launch.name || ""} onChange={this.handleChange} />
                            </div>
                        </div>

                        <div className="form-group row">
                            <label className="col-4 col-form-label">Environments</label>
                            <div className="col-8">
                                <CreatableSelect value={(this.state.launch.environments || []).map(function(val){return {value: val, label: val}})}
                                            isMulti
                                            isClearable
                                            cacheOptions
                                            onChange={this.changeEnvironments}
                                            options={(this.state.project.environments || []).map(function(val){return {value: val, label: val}})}
                                           />
                            </div>
                        </div>


                        <div className="form-group row">
                            <label className="col-4 col-form-label">Launcher</label>
                            <div className="col-8">
                                <select id="launcherUUID" className="form-control" onChange={(e) => this.handleLauncherChange(e, 0, "uuid")}>
                                    <option> </option>
                                    {
                                        (this.state.project.launcherConfigs || []).map(function(config){
                                            var selected = config.uuid == (this.state.launch.launcherConfig || {}).uuid;
                                            if (selected){
                                                return (<option value={config.uuid} selected>{config.name}</option>)
                                            }
                                            return (<option value={config.uuid} >{config.name}</option>)

                                        }.bind(this))
                                    }
                                </select>
                            </div>
                         </div>
                    </form>
                    <div>
                        {this.state.launch.launcherConfig && this.state.launch.launcherConfig.uuid &&
                            <LauncherForm launcherConfig={this.state.launch.launcherConfig} configIndex={0} selectableType={false}
                                handleLauncherChange={this.handleLauncherChange} launcherDescriptors={this.state.launcherDescriptors}/>
                        }
                    </div>
                </div>
        }


        return (
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Launch</h5>
                    <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                      <span aria-hidden="true">&times;</span>
                    </button>
                  </div>

                  {this.state.loading &&
                      <div className='sweet-loading launch-form-spinner'>
                             <FadeLoader
                               sizeUnit={"px"}
                               size={100}
                               color={'#135f38'}
                               loading={this.state.loading}
                             />
                       </div>
                  }

                  {!this.state.loading &&
                    <div>
                      <div>
                        {modalBody}
                      </div>

                      <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-dismiss="modal">Close</button>
                        {(!this.state.launch.id || this.state.restart) &&
                        <button type="button" className="btn btn-primary" onClick={this.handleSubmit}>Create Launch</button>
                        }
                      </div>
                    </div>
                  }

                </div>
             </div>
        );
      }


}

export default withRouter(LaunchForm);
