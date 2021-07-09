import React from 'react';
import { withRouter } from 'react-router';
import SubComponent from '../common/SubComponent';
import Pager from '../pager/Pager';
import { Link } from 'react-router-dom';
import * as Utils from '../common/Utils';
import Backend from '../services/backend';
class Users extends SubComponent {

    state = {
        users: [],
        filter: {
            skip: 0,
            limit: 20,
            orderby: "firstName",
            orderdir: "ASC",
            includedFields: "firstName,lastName,login,id"
        },
        pager: {
            total: 0,
            current: 0,
            maxVisiblePage: 7,
            itemsOnPage: 20
        },
        loading: true
    };

    constructor(props) {
        super(props);

        this.getUsers = this.getUsers.bind(this);
        this.getPager = this.getPager.bind(this);
        this.updateUrl = this.updateUrl.bind(this);
        this.handlePageChanged = this.handlePageChanged.bind(this);
    }

    componentDidMount() {
        super.componentDidMount();

        this.state.filter = Object.assign(this.state.filter,
            Utils.queryToFilter(this.props.location.search.substring(1))
        );
        this.getUsers();
        this.getPager();
    }

    getUsers(){
        Backend.get("user?" + Utils.filterToQuery(this.state.filter))
          .then(response => {
            this.state.users = response.data;
            this.state.loading = false;
            this.setState(this.state);
          }).catch(error => {
            Utils.onErrorMessage("Couldn't get users: ", error);
            this.state.loading = false;
            this.setState(this.state);
          });
     }

    getPager(){
        var countFilter = Object.assign({skip:0, limit:0}, this.state.filter);
        Backend.get("user/count?" + Utils.filterToQuery(countFilter))
            .then(response => {
                 this.state.pager.total = response.data;
                 this.state.pager.current = this.state.filter.skip / this.state.filter.limit;
                 this.state.pager.visiblePage = Math.min(response.data / this.state.pager.itemsOnPage + 1, this.state.pager.maxVisiblePage);
                 this.setState(this.state);
        }).catch(error => console.log(error));
    }

    updateUrl(){
        this.props.history.push("/user?"+ Utils.filterToQuery(this.state.filter));
    }

    handlePageChanged(newPage) {
        this.state.pager.current = newPage;
        this.state.filter.skip = newPage * this.state.pager.itemsOnPage;
        this.getUsers();
        this.setState(this.state);
        this.updateUrl();
    }

    render() {
        return (
          <div>
              <div>
                <table class="table table-striped">
                    <thead>
                      <tr>
                        <th scope="col">User</th>
                      </tr>
                    </thead>
                    <tbody>
                        {this.state.users.map(function(user){
                            return(
                                <tr>
                                    <td>
                                        <Link to={'/user/profile/' + user.login}>
                                            {user.firstName} {user.lastName} <span className="text-muted">@{user.login}</span>
                                        </Link>
                                   </td>
                                </tr>
                            )
                        })}
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

export default withRouter(Users);
