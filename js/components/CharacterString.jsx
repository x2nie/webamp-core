import React from 'react';
import Character from './Character.jsx';

module.exports = (props) => {
  const text = '' + props.children;
  const chars = text.split('');
  return <div {...props}>
    {chars.map((character, index) => {
      return <Character key={index + character}>{character}</Character>;
    })};
  </div>;
};

// TODO: Require that props.children be a string
