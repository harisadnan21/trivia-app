import React from 'react';
import PropTypes from 'prop-types';

import styles from './styles.module.css';

const Loader = ({ margin }) => {
  return (
    <div className={styles.holder} style={{ margin }}>
      <div className={styles.bounce1} />
      <div className={styles.bounce2} />
      <div className={styles.bounce3} />
    </div>
  );
};

Loader.propTypes = {
  margin: PropTypes.string,
};

export default Loader;
