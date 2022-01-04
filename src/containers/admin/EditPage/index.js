import React from 'react';
import PropTypes from 'prop-types';
import { Redirect, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import isImageUrl from 'is-image-url';

import styles from './styles.module.css';
import { withFirebase } from '../../../components/Firebase/firebase';
import TextInput from '../../../components/TextInput';
import Loader from '../../../components/Loader';
import PopUp from '../../../components/PopUp';

class EditPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      quiz: {},
      redirect: false,
      round: 'round1',
      saving: false,
      editTitle: false,
      showImageModal: false,
      imageUrl: '',
      imageIndex: 0,
      uploadingImage: false,
      uploadError: false,
    };

    this.id = props.match.params.id;
    this.firebase = props.firebase;

    this.setValue = this.setValue.bind(this);
    this.setTitle = this.setTitle.bind(this);
    this.save = this.save.bind(this);
    this.uploadImage = this.uploadImage.bind(this);
    this.removeImage = this.removeImage.bind(this);
  }

  componentDidMount() {
    this.firebase.getQuiz(this.id, (res) => {
      if (!res.success) {
        this.setState({ redirect: true });
      } else {
        this.setState({ quiz: res.data });
      }
    });
  }

  setValue(e, type, index) {
    const quiz = JSON.parse(JSON.stringify(this.state.quiz));
    const round = quiz[this.state.round];
    if (type === 'q') {
      round[index].questionText= e.target.value;
    } else if (type === 'a') {
      round[index].answer = e.target.value;
    } else {
      round[index].points = Math.max(e.target.value, 0);
    }
    this.setState({ quiz });
  }

  setTitle(e) {
    const quiz = JSON.parse(JSON.stringify(this.state.quiz));
    quiz.name = e.target.value;
    this.setState({ quiz });
  }

  save(next) {
    this.setState({ saving: true });
    // our callback is actually to call the function here that will
    // call this functions callback/next function
    this.firebase.saveQuiz(this.id, this.state.quiz, () => next());
  }

  uploadImage() {
    this.setState({ uploadingImage: true });
    // make sure we are uploading an image to the game
    if (!isImageUrl(this.state.imageUrl)) {
      this.setState({ uploadingImage: false, uploadError: true });
      return;
    }
    // upload the image
    this.firebase.uploadImage(this.state.imageUrl, (url, id) => {
      if (!url) {
        this.setState({ uploadingImage: false, uploadError: true });
        return;
      }
      // update our quiz with the image
      const quiz = JSON.parse(JSON.stringify(this.state.quiz));
      const round = quiz[this.state.round];
      round[this.state.imageIndex].image = url;
      round[this.state.imageIndex].imageId = id;
      // we save immediately because we uploaded the image
      this.setState({
        quiz,
        showImageModal: false,
        uploadingImage: false,
      }, () => this.save(() => this.setState({ saving: false, })));
    });
  }

  removeImage(index) {
    // get the quiz
    const quiz = JSON.parse(JSON.stringify(this.state.quiz));
    const round = quiz[this.state.round];
    // delete the image from the database
    this.firebase.removeImage(round[index].imageId);
    // we don't need to wait, just remove the image from our quiz
    round[index].image = '';
    round[index].imageId = '';
    // save immediately because we just delted it from storage
    this.setState({ quiz, showImageModal: false }, () => this.save(() => this.setState({ saving: false })));
  }

  render() {
    if (!this.id || this.state.redirect) {
      return <Redirect to="/admin/dashboard" />
    }

    return this.state.quiz.name !== undefined ? (
      <div className={styles.container}>
        <div className={styles.headerContainer}>
          <div className={styles.header}>
            {this.state.quiz.name}
          </div>

          {this.state.saving ? (
            <div className={styles.buttonContainer}>
              <Loader margin="auto" />
            </div>
          ) : (
            <div className={styles.buttonContainer}>
              <div
                className={styles.button}
                role="button"
                tabIndex={0}
                onClick={() => this.setState({ editTitle: true })}
              >
                <i className={classNames('fas fa-pencil-alt', styles.buttonIcon)} />
                <div className={styles.buttonText}>
                  edit title
                </div>
              </div>

              <div
                className={styles.button}
                role="button"
                tabIndex={0}
                onClick={() => this.save(() => this.setState({ saving: false }))}
              >
                <i className={classNames('fas fa-save', styles.buttonIcon)} />
                <div className={styles.buttonText}>
                  save
                </div>
              </div>

              <div
                className={styles.button}
                role="button"
                tabIndex={0}
                onClick={() => this.save(() => this.props.history.push('/admin/dashboard'))}
                style={{ marginRight: 0 }}
              >
                <i className={classNames('fas fa-running', styles.buttonIcon)} />
                <div className={styles.buttonText}>
                  {'save & exit'}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.roundContainer}>
          <div
            className={classNames(styles.round, { [styles.selected]: this.state.round === 'round1' })}
            role="button"
            tabIndex={0}
            onClick={() => this.setState({ round: 'round1' })}
          >
            round 1
          </div>
          <div
            className={classNames(styles.round, { [styles.selected]: this.state.round === 'round2' })}
            role="button"
            tabIndex={0}
            onClick={() => this.setState({ round: 'round2' })}
          >
            round 2
          </div>
          <div
            className={classNames(styles.round, { [styles.selected]: this.state.round === 'round3' })}
            role="button"
            tabIndex={0}
            onClick={() => this.setState({ round: 'round3' })}
          >
            round 3
          </div>
        </div>

        {this.state.quiz[this.state.round].map((data, index) => (
          <div className={styles.questionContainer} key={index}>
            {index === 11 ? (
              <i className={classNames('fas fa-not-equal', styles.questionNum)} />
            ) : index === 10 ? (
              <i className={classNames('fas fa-star', styles.questionNum)} />
            ) : (
              <div className={styles.questionNum}>
                {index + 1}
              </div>
            )}

            <div className={styles.inputsContainer}>
              <div className={styles.inputContainer}>
                <div className={styles.inputText}>
                  q:
                </div>
                <TextInput
                  placeholder="question"
                  value={this.state.quiz[this.state.round][index].questionText}
                  onChange={(e) => this.setValue(e, 'q', index)}
                  width="100%"
                />
              </div>

              <div className={styles.inputContainer}>
                <div className={styles.inputText}>
                  a:
                </div>
                <TextInput
                  placeholder="answer"
                  value={this.state.quiz[this.state.round][index].answer}
                  onChange={(e) => this.setValue(e, 'a', index)}
                  width="100%"
                />
              </div>
            </div>

            <div className={styles.centeredRow}>
              <div className={styles.pointsContainer}>
                <TextInput
                  value={this.state.quiz[this.state.round][index].points}
                  onChange={(e) => this.setValue(e, 'pts', index)}
                  type="number"
                  width="100%"
                  customStyle={{
                    fontSize: '34px',
                    lineHeight: '34px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}
                />
                <div className={styles.pointsText}>
                  {this.state.quiz[this.state.round][index].points === 1 ? 'point' : 'points'}
                </div>
              </div>

              <div className={styles.imageContainer}>
                {this.state.quiz[this.state.round][index].image ? (
                  <div className={styles.imageContainer}>
                    <img src={this.state.quiz[this.state.round][index].image} alt="Question" className={styles.image} />
                    <i className={classNames(styles.deleteImage, 'fas fa-times')} role="button" tabIndex={0} onClick={() => this.removeImage(index)} />
                  </div>
                ) : (
                  <div
                    className={styles.imageButton}
                    role="button"
                    tabIndex={-1}
                    onClick={() => this.setState({ showImageModal: true, imageIndex: index, imageUrl: '' })}
                  >
                    <i className={classNames(styles.imageIcon, 'far fa-image')} />
                    <div className={styles.imageText}>
                      add image
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {this.state.editTitle ? (
          <PopUp
            text="fine, change the title..."
            buttonOne={{
              text: 'cool',
              onClick: () => this.save(() => this.setState({ saving: false, editTitle: false })),
            }}
            loading={this.state.saving}
            inputValue={this.state.quiz.name}
            inputChange={this.setTitle}
            inputPlaceholder="title"
          />
        ) : this.state.showImageModal ? (
          <PopUp
            text={this.state.uploadError ? "we couldn't find the image at that url..." : 'give me image url, now...'}
            buttonOne={{
              text: 'add',
              onClick: this.uploadImage,
            }}
            buttonTwo={{
              text: 'nvm',
              onClick: () => this.setState({ showImageModal: false })
            }}
            loading={this.state.uploadingImage}
            inputValue={this.state.imageUrl}
            inputChange={(e) => this.setState({ imageUrl: e.target.value, uploadError: false, })}
            inputPlaceholder="image url"
          />
        ) : null}
      </div>
    ) : null;
  }
}

EditPage.propTypes = {
  match: PropTypes.object,
  history: PropTypes.object,
};

export default withRouter(withFirebase(EditPage));
