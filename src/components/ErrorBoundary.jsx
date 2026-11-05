import { Component } from 'react'
import ErrorPanel from './ErrorPanel.jsx'

/** Catches unexpected render errors so a game never leaves a blank screen. */
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <ErrorPanel
          what="This challenge hit an unexpected problem."
          fix="Press Retry to restart it, or go back to the Arcade and pick another challenge."
          onRetry={() => this.setState({ failed: false })}
          onBack={this.props.onBack}
        />
      )
    }
    return this.props.children
  }
}
