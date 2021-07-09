import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';

class Projects extends Component {
    state = {
        projects: [],
        loading: true
    };

    componentDidMount() {
        Backend.get("project")
          .then(response => {
            const projects = response.data;
            // eslint-disable-next-line react/no-direct-mutation-state
            this.state.loading = false;
            const newState = Object.assign({}, this.state, {
              projects: projects
            });
            this.setState(newState);
          }).catch(error => {
            Utils.onErrorMessage("Couldn't get projects: ", error);
            // eslint-disable-next-line react/no-direct-mutation-state
            this.state.loading = false;
            this.setState(this.state);
          });
     }


    render() {
        return (
          <div className='container'>
            <div className='sweet-loading'>
                 <FadeLoader
                   sizeUnit={"px"}
                   size={100}
                   color={'#135f38'}
                   loading={this.state.loading}
                 />
           </div>
            {
                this.state.projects.map(function(project){
                    return (
                        <div className="card project-card" key={project.id}>
                          <div className="card-header">
                            <span>
                                <Link to={'/projects/' + project.id}>{project.name}</Link>
                            </span>
                            <span className='float-right'>
                                <Link to={'/projects/' + project.id + '/settings'}>
                                    <FontAwesomeIcon icon={faCogs}/>
                                </Link>
                            </span>
                          </div>
                          <div className="card-body">
                            <p className="card-text">{project.description || ''}</p>
                          </div>
                        </div>
                    )
                })
            }
          </div>
        );
      }

}

export default Projects;
