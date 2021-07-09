/* eslint-disable eqeqeq */
import React from 'react';
import SubComponent from '../common/SubComponent'
import { Link } from 'react-router-dom';
import $ from 'jquery';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import { faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import * as Utils from '../common/Utils';
import Backend from '../services/backend';

class Comments extends SubComponent {
    constructor(props) {
        super(props);

        this.commentToRemove = null;

        this.state = {
             comments: [],
             commentToEdit: {}
         };

         this.projectId = props.projectId;
         this.entityId = props.entityId;
         this.entityType = props.entityType;
         this.onCommentsNumberChanged = props.onCommentsNumberChanged;
         this.getComments = this.getComments.bind(this);
         this.handleSubmit = this.handleSubmit.bind(this);
         this.handleChange = this.handleChange.bind(this);
         this.cancelEdit = this.cancelEdit.bind(this);
         this.refreshCommentToEdit = this.refreshCommentToEdit.bind(this);
         this.removeComment = this.removeComment.bind(this);
         this.removeCommentConfirmation = this.removeCommentConfirmation.bind(this);
         this.cancelRemoveCommentConfirmation = this.cancelRemoveCommentConfirmation.bind(this);
         this.refreshCommentToEdit();
         this.handleUpdateChange = this.handleUpdateChange.bind(this);
         this.handleUpdateSubmit = this.handleUpdateSubmit.bind(this);
      }

    componentDidMount() {
        super.componentDidMount();
     }

    componentWillReceiveProps(nextProps) {
      var fetchCommentsNeeded = nextProps.forceFetch || false;
      if (nextProps.entityId){
        fetchCommentsNeeded = fetchCommentsNeeded || (this.entityId != nextProps.entityId);
        this.entityId = nextProps.entityId;
        this.state.commentToEdit.entityId = nextProps.entityId;
        this.refreshCommentToEdit()
      }
      if (nextProps.entityType){
        fetchCommentsNeeded = fetchCommentsNeeded || (this.entityType != nextProps.entityType);
        this.entityType = nextProps.entityType;
        this.state.commentToEdit.entityType = nextProps.entityType;
        this.refreshCommentToEdit()
      }
      if (nextProps.projectId){
        fetchCommentsNeeded = fetchCommentsNeeded || (this.projectId != nextProps.projectId);
        this.projectId = nextProps.projectId;
      }
      if (nextProps.hideForm){
        this.hideForm = nextProps.hideForm;
      }
      if (fetchCommentsNeeded){
        this.getComments();
      } else {
        this.setState(this.state);
      }
    }

    refreshCommentToEdit(){
        this.state.commentToEdit = {text: "", entityId: this.entityId, entityType: this.entityType};
    }

    getComments(){
        Backend.get(this.projectId + "/comment?entityType="+ this.entityType + "&entityId=" + this.entityId + "&orderby=createdTime&orderdir=DESC")
          .then(response => {
            this.state.comments = response.data;
            if (this.onCommentsNumberChanged){
                this.onCommentsNumberChanged(this.state.comments.length);
            }
            this.setState(this.state);
          }).catch(error => console.log(error));
    }

    handleChange(fieldName, event, index){
        this.state.commentToEdit[fieldName] = event.target.value;
        this.setState(this.state);
    }

    cancelEdit(index, event){
        $("#comment-" + index + "-display").show();
        $("#comment-" + index + "-form").hide();
    }

    toggleEdit(index, event){
        $("#comment-" + index + "-display").hide();
        $("#comment-" + index + "-form").show();
    }

    removeCommentConfirmation(commentId){
        this.commentToRemove = commentId;
        $("#remove-comment-confirmation").modal("show");
    }

    cancelRemoveCommentConfirmation(){
        this.commentToRemove = null;
        $("#remove-comment-confirmation").modal("hide");
    }


    removeComment(event){
        Backend.delete(this.projectId + "/comment/" + this.commentToRemove)
            .then(() => {
                this.state.comments = this.state.comments.filter(comment => comment.id != this.commentToRemove);
                if (this.onCommentsNumberChanged){
                    this.onCommentsNumberChanged(this.state.comments.length);
                }
                this.commentToRemove = null;
                $("#remove-comment-confirmation").modal("hide");
                this.setState(this.state);
        }).catch(error => {Utils.onErrorMessage("Couldn't delete a comment: ", error)});
    }

    handleSubmit(event){
        Backend.put(this.projectId + '/comment/', this.state.commentToEdit)
            .then(response => {
                this.state.comments.unshift(response.data);
                this.refreshCommentToEdit();
                if (this.onCommentsNumberChanged){
                    this.onCommentsNumberChanged(this.state.comments.length);
                }
                this.setState(this.state);
        }).catch(error => {Utils.onErrorMessage("Couldn't create a comment: ", error)});
        event.preventDefault();
    }

    handleUpdateChange(index, event){
        this.state.comments[index].text = event.target.value;
        this.setState(this.state);
        event.preventDefault();
    }

    handleUpdateSubmit(index, event){
        Backend.post(this.projectId + '/comment/', this.state.comments[index])
                .then(response => {
                    this.state.comments[index] = response.data;
                    this.setState(this.state);
                    this.cancelEdit(index, event);
            }).catch(error => {Utils.onErrorMessage("Couldn't update comment: ", error)});
    }



    render() {
        return (
            <div>
                <div id="comments">
                    {
                      this.state.comments.map(function(comment, i){
                          return (
                            <div className="card project-card container">
                                <div className="card-header row">
                                    <div className="col-10">
                                        <Link to={"/user/profile/" + comment.createdBy}>{comment.createdBy}</Link>  {Utils.timeToDate(comment.createdTime)}
                                    </div>

                                    { Utils.isUserOwnerOrAdmin(comment.createdBy) &&
                                        <div className="col-2">
                                            <span className="clickable edit-icon-visible" onClick={(e) => this.toggleEdit(i, e)}>
                                                <FontAwesomeIcon icon={faPencilAlt}/>
                                            </span>
                                            <span className="clickable edit-icon-visible red" onClick={(e) => this.removeCommentConfirmation(comment.id, e)}>
                                                <FontAwesomeIcon icon={faMinusCircle}/>
                                            </span>
                                        </div>
                                    }
                                </div>
                                <div className="card-body">
                                    <div className="inplace-display" id={"comment-" + i + "-display"} index={i}>
                                        <p className="card-text">{comment.textFormatted || ''}</p>
                                    </div>
                                    <div id={"comment-" + i + "-form"} index={i} lassName="inplace-form" style={{display: 'none'}}>
                                        <form>
                                            <textarea rows="7" cols="70" name="text" onChange={(e) => this.handleUpdateChange(i, e)} value={comment.text}></textarea>
                                            <div>
                                                <button type="button" className="btn btn-light" onClick={(e) => this.cancelEdit(i, e)}>Cancel</button>
                                                <button type="button" className="btn btn-primary" onClick={(e) => this.handleUpdateSubmit(i, e)}>Save</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                          );
                      }.bind(this))
                    }
                </div>
                {!this.hideForm &&
                <div id="comment-form">
                    <form>
                        <textarea rows="7" cols="70" name="text" onChange={(e) => this.handleChange("text", e)} value={this.state.commentToEdit.text}></textarea>
                        <div>
                            <button type="button" className="btn btn-primary" onClick={(e) => this.handleSubmit(e)}>Save</button>
                        </div>
                    </form>
                </div>
                }

                <div className="modal fade" tabIndex="-1" role="dialog" id="remove-comment-confirmation">
                    <div className="modal-dialog" role="document">
                        <div className="modal-content">
                          <div className="modal-header">
                            <h5 className="modal-title">Remove Comment</h5>
                            <button type="button" className="close" onClick={this.cancelRemoveCommentConfirmation} aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                            </button>
                          </div>
                          <div className="modal-body">Are you sure you want to remove comment?</div>
                          <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={this.cancelRemoveCommentConfirmation}>Close</button>
                            <button type="button" className="btn btn-danger" onClick={this.removeComment}>Remove Comment</button>
                          </div>
                        </div>
                     </div>
                 </div>

            </div>
        );

      }

}

export default Comments;
