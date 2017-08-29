import React from "react";
import { connect } from "react-redux";

import Balance from "../Balance";

const offsetFromBalance = balance => {
  const percent = Math.abs(balance) / 100;
  const sprite = Math.round(percent * 28);
  const offset = (sprite - 1) * 15;
  return offset;
};

const MainBalance = props => (
  <Balance
    id="balance"
    style={{ backgroundPosition: `0 -${offsetFromBalance(props.balance)}px` }}
  />
);

const mapStateToProps = state => ({ balance: state.media.balance });

export default connect(mapStateToProps)(MainBalance);
