import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class Profile extends SubComponent {

    state = {
        profile:{}
    };

    constructor(props) {
        super(props);
        this.getUser = this.getUser.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();
        this.state.profile.id = this.props.match.params.profileId;
        this.getUser();
    }

    getUser(){
        Backend.get("user/" + this.state.profile.id)
          .then(response => {
            this.state.profile = response.data;
            this.setState(this.state);
          }).catch(error => {Utils.onErrorMessage("Couldn't get user: ", error)});
     }


    render() {
        return (
          <div>
              <h1>{this.state.profile.firstName} {this.state.profile.lastName} <span className="text-muted">({this.state.profile.login})</span> </h1>
              <div>
                <div className="row">
                    <div className="col-12">Edit Profile Details</div>
                </div>
                <div className="row">
                    <div className="col-12"><Link to="/user/change-password-redirect">Change Password</Link></div>
                </div>

                {Utils.isUserOwnerOrAdmin() &&
                <div className="row">
                    <div className="col-12">Suspend User</div>
                </div>
                }

              </div>
          </div>
        );
      }

}

export default withRouter(Profile);
