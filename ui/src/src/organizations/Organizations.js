import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'
import * as Utils from '../common/Utils';
import { FadeLoader } from 'react-spinners';
import Backend from '../services/backend';
class Organizations extends Component {
    state = {
        organizations: [],
        loading: true
    };

    componentDidMount() {
        Backend.get("organization")
          .then(response => {
            const organizations = response.data;
            this.state.loading = false;
            const newState = Object.assign({}, this.state, {
              organizations: organizations
            });
            this.setState(newState);
          }).catch(error => {
            Utils.onErrorMessage("Couldn't get organizations: ", error);
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
                this.state.organizations.map(function(organizations){
                    return (
                        <div className="card organization-card">
                          <div className="card-header">
                            <span>
                                <Link to={'/organizations/' + organization.id}>{organization.name}</Link>
                            </span>
                            <span className='float-right'>
                                <Link to={'/organization/' + organization.id + '/settings'}>
                                    <FontAwesomeIcon icon={faCogs}/>
                                </Link>
                            </span>
                          </div>
                          <div className="card-body">
                            <p className="card-text">{organization.description || ''}</p>
                          </div>
                        </div>
                    )
                })
            }
          </div>
        );
      }

}

export default Organizations;
