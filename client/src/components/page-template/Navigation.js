import React from "react";
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  HeaderMenu,
  HeaderMenuButton,
  Modal,
  Theme,
} from "@carbon/react";
import { Reset, Download, Code, CodeHide } from "@carbon/icons-react";
import PropTypes from "prop-types";
import LeftNav from "./LeftNav";
import { downloadContent } from "./DownloadConfig";
import { validate } from "../../lib";

class Navigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileDownloadUrl: "",
      showModal: false,
      expanded: false,
    };
    this.isResetState = this.isResetState.bind(this);
    this.onModalClose = this.onModalClose.bind(this);
    this.onModalShow = this.onModalShow.bind(this);
    this.onHamburgerClick = this.onHamburgerClick.bind(this);
    this.onDownloadClick = this.onDownloadClick.bind(this);
  }
  // Reset state and redirect to home page
  isResetState() {
    window.localStorage.removeItem("craigStore");
    window.localStorage.removeItem("craigDevStore");
    window.location.href = "/";
  }

  onModalClose = () => {
    this.setState({ showModal: false });
  };

  onModalShow = () => {
    this.setState({ showModal: true });
  };

  onHamburgerClick() {
    this.setState({ expanded: !this.state.expanded });
  }

  onDownloadClick() {
    let notification = {
      title: "Success",
      kind: "success",
      text: `Successfully downloaded configuration.`,
      timeout: 3000,
    };
    let validated = false;
    try {
      validate(this.props.json);
      validated = true; // if we are here, successfully validated
    } catch (err) {
      console.error(err);
      notification = {
        title: "Error",
        kind: "error",
        text: `Invalid configuration.\n${err.message}`,
      };
    }
    if (validated) {
      let error = downloadContent(this.props.json);
      if (error) {
        console.error(error);
        notification = {
          title: "Error",
          kind: "error",
          text: `Unable to download configuration.\n${error.message}`,
        };
      }
    }
    this.props.notify(notification);
  }

  render() {
    return (
      <Theme theme="g10">
        <Header aria-label="IBM Platform Name">
          <HeaderMenuButton
            aria-label="Open menu"
            isCollapsible
            onClick={this.onHamburgerClick}
            isActive={this.state.expanded}
          />
          <HeaderName href="/" prefix="">
            CRAIG
          </HeaderName>
          {this.props.project && (
            <HeaderMenu
              className="no-marker"
              menuLinkName={`Project: ${this.props.project.name}`}
            >
              <div className="headerMenuBox">
                <p className="smallerText marginBottomXs">
                  Project: {this.props.project.name}
                </p>
                {this.props.project.description && (
                  <p className="smallerText marginBottomXs">
                    Description: {this.props.project.description}
                  </p>
                )}
                <p className="smallerText">
                  Saved:{" "}
                  {new Date(this.props.project.last_save).toLocaleString()}
                </p>
              </div>
            </HeaderMenu>
          )}
          <HeaderGlobalBar>
            {this.props.isResetState === false &&
              this.props.formPathNotPresent === false && (
                <HeaderGlobalAction
                  aria-label={
                    this.props.hideCodeMirror
                      ? "Show Code Mirror Pane"
                      : "Hide Code Mirror Pane"
                  }
                  isActive
                  onClick={() => this.props.onJsonToggle()}
                  tooltipAlignment="end"
                >
                  {this.props.hideCodeMirror ? <Code /> : <CodeHide />}
                </HeaderGlobalAction>
              )}
            {this.props.isResetState === false && (
              <HeaderGlobalAction
                aria-label="Download Environment Terraform"
                isActive
                onClick={this.onDownloadClick}
                tooltipAlignment="end"
              >
                <Download />
              </HeaderGlobalAction>
            )}
            <HeaderGlobalAction
              aria-label="Reset State"
              isActive
              onClick={this.onModalShow}
              tooltipAlignment="end"
            >
              <Reset />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
          <LeftNav
            expanded={this.state.expanded}
            onOverlayClick={this.onHamburgerClick}
            navCategories={this.props.navCategories}
          />
          {this.state.showModal && (
            <Modal
              modalHeading="Reset state"
              open={this.state.showModal}
              onRequestSubmit={this.isResetState}
              onRequestClose={this.onModalClose}
              primaryButtonText="Reset"
              secondaryButtonText="Cancel"
              size="xs"
              danger={true}
              className="hard-left"
            >
              <p>
                Are you sure you want to reset state data? Clicking reset will
                remove any and all changes you have made.
              </p>
            </Modal>
          )}
        </Header>
      </Theme>
    );
  }
}

Navigation.defaultProps = {
  hideCodeMirror: false,
  isResetState: false,
};

Navigation.propTypes = {
  onJsonToggle: PropTypes.func.isRequired,
  hideCodeMirror: PropTypes.bool.isRequired,
  navCategories: PropTypes.array.isRequired,
  isResetState: PropTypes.bool.isRequired,
};

export default Navigation;
