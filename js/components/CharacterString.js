import React from "react";
import PropTypes from "prop-types";
import Character from "./Character";

const CharacterString = props => {
  const text = `${props.children}` || "";
  const chars = text.split("");
  return (
    <div {...props}>
      {chars.map((character, index) => (
        <Character key={index + character}>{character}</Character>
      ))}
    </div>
  );
};

CharacterString.propsTypes = {
  children: PropTypes.string
};

export default CharacterString;
