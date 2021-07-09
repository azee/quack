/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCogs } from '@fortawesome/free-solid-svg-icons'
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class Organization extends SubComponent {

    constructor(props) {
        super(props);
        this.state = {
             organization: {
                 id: null,
                 name: "",
                 description: "",
                 allowedGroups: [],
                 allowedUsers: [],
                 admins: []
             }
         };
         this.getOrganization = this.getOrganization.bind(this);
         this.onOrganizationChange = props.onOrganizationChange;
      }

    componentDidMount() {
        super.componentDidMount();
        this.state.organization.id = this.props.match.params.organization;
        this.getOrganization();
    }

     componentWillReceiveProps(nextProps) {
        var nextOrganizationId = nextProps.match.params.organization;
        if(nextOrganizationId && this.state.organization.id != nextOrganizationId){
            this.state.organization.id = nextOrganizationId;
            this.onOrganizationChange(this.state.organization.id);
            this.getOrganization();
        }
     }

     getOrganization(){
        Backend.get("organization/" + this.state.organization.id)
          .then(response => {
            this.state.organization = response.data;
            this.setState(this.state);
          }).catch(error => {Utils.onErrorMessage("Couldn't get organization: ", error)});
     }


    render() {
        return (
            <div>
                <div className="organization-header">
                    <h1>
                        {this.state.organization.name}
                        <span className='float-right'>
                            <Link to={'/organizations/' + this.state.organization.id + '/settings'} className='organization-title-settings-link'>
                                <FontAwesomeIcon icon={faCogs}/>
                            </Link>
                        </span>
                    </h1>
                </div>
            </div>
        );
      }

}

export default Organization;
