import React, { Component } from 'react';
import { withRouter } from 'react-router';
import qs from 'qs';
import Backend from '../services/backend';
class Auth extends Component {
    render() {
        return (
          <div>

          </div>
        );
      }

    componentDidMount() {
        var params = qs.parse(this.props.location.search.substring(1));
        Backend.get("user/login-redirect")
          .then(response => {
            var url = response.data.url || "/login";
            var retpath = params.retpath || "";
            var retpathParamName = response.data.retpathParamName || "retpath";
            if (retpath.startsWith(window.location.origin + "/auth") ||
                            retpath.startsWith(window.location.origin + "/login")){
                retpath = "/";
            }

            url = url +  "?" + retpathParamName + "=" + encodeURIComponent(retpath);
            window.location = url;
          })
          .catch(error => console.log(error));
    }

}

export default withRouter(Auth);
