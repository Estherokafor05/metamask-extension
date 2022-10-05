import React from 'react';
import ReactDOM from 'react-dom';
import { PropTypes } from 'prop-types';

import classnames from 'classnames';
import ReactCSSTransitionGroup from 'react-transition-group/CSSTransitionGroup';

import Box from '../box';
import {
  ALIGN_ITEMS,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

const modalRoot = document.querySelector('#custom-root');

const defaultHeaderProps = {
  padding: [6, 4, 4],
  display: 'flex',
  flexDirection: FLEX_DIRECTION.COLUMN,
};

const defaultContentProps = {
  display: 'flex',
  flexDirection: FLEX_DIRECTION.COLUMN,
  justifyContent: JUSTIFY_CONTENT.FLEX_START,
  alignItems: ALIGN_ITEMS.STRETCH,
};

const defaultFooterProps = {
  display: 'flex',
  justifyContent: JUSTIFY_CONTENT.SPACE_BETWEEN,
  padding: [4, 6, 6],
};

const SlideUp = ({
  open,
  closeModal,
  children,
  footer,
  header,
  className,
  headerClassName,
  contentClassName,
  footerClassName,
  headerProps = defaultHeaderProps,
  contentProps = defaultContentProps,
  footerProps = defaultFooterProps,
}) => {
  const handleClick = (e) => {
    if (e.target.id === 'slide-up-modal-overlay') {
      closeModal();
    }
  };

  const modal = (
    <ReactCSSTransitionGroup
      transitionAppear={open}
      transitionAppearTimeout={500}
      transitionLeaveTimeout={500}
      transitionName="slide-up"
    >
      <div
        className="slide-up-modal-overlay"
        id="slide-up-modal-overlay"
        onClick={handleClick}
      >
        <Box className={classnames('slide-up-modal', className)}>
          {header ? (
            <Box
              className={classnames('slide-up-modal__header', headerClassName)}
              {...{ ...defaultFooterProps, ...headerProps }}
            >
              {header}
            </Box>
          ) : null}
          {children ? (
            <Box
              className={classnames(
                'slide-up-modal__content',
                contentClassName,
              )}
              {...{ ...defaultContentProps, ...contentProps }}
            >
              {children}
            </Box>
          ) : null}
          {footer ? (
            <Box
              className={classnames('slide-up-modal__footer', footerClassName)}
              {...{ ...defaultFooterProps, ...footerProps }}
            >
              {footer}
            </Box>
          ) : null}
        </Box>
      </div>
    </ReactCSSTransitionGroup>
  );

  return ReactDOM.createPortal(modal, modalRoot);
};

SlideUp.propTypes = {
  /**
   * Boolean prop to render slide up animation
   */
  open: PropTypes.boolean,
  /**
   * Show header content could be react child or text
   */
  header: PropTypes.node,
  /**
   * Show children content could be react child or text
   */
  children: PropTypes.node,
  /**
   * Show footer content could be react child or text
   */
  footer: PropTypes.node,
  /**
   * Add custom CSS class for footer
   */
  footerClassName: PropTypes.string,
  /**
   * closeModal handler
   */
  onClose: PropTypes.func,
  /**
   * Add custom CSS class for content
   */
  contentClassName: PropTypes.string,
  /**
   * Add custom CSS class
   */
  className: PropTypes.string,
  /**
   * Box props for the header
   */
  headerProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the content
   */
  contentProps: PropTypes.shape({ ...Box.propTypes }),
  /**
   * Box props for the footer
   */
  footerProps: PropTypes.shape({ ...Box.propTypes }),
};

export default SlideUp;