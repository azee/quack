import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent'
import * as Utils from '../common/Utils';
import Backend from '../services/backend';

class ChangePassword extends SubComponent {

    state = {

    };

    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange(event) {
        this.state[event.target.name] = event.target.value;
        this.setState(this.state);
    }


    isPasswordValid(password){
        return password && password.length > 4;
    }

    handleSubmit(event) {
        if (!this.isPasswordValid(this.state.password)){
           Utils.onErrorMessage("Password is invalid");
           event.preventDefault();
           return;
        }
        Backend.post('user/change-password', {newPassword: this.state.password})
        .then(response => {
            Utils.onSuccessMessage("Password successfully updated");
            window.location = "/";
        }).catch(error => {
          Utils.onErrorMessage("Couldn't change password: ", error);
        })
        event.preventDefault();
    }


    render() {
        return (
          <div className="text-center">
          <form className="form-signin">
            <h1 className="h3 mb-3 font-weight-normal">Change Password</h1>
            <input type="password" id="password" name="password" className="form-control" placeholder="New Password"
                  required="" onChange={this.handleChange} />
            <button className="btn btn-lg btn-primary btn-block" onClick={this.handleSubmit}>Submit</button>
          </form>
        </div>
        );
      }

}

export default withRouter(ChangePassword);
