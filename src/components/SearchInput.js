import PropTypes from 'prop-types';
import React, {useEffect, useState} from 'react';
import querystring from 'querystring';
import {Box, List, ListItem, Text, chakra} from '@chakra-ui/core';
import {useDebounce} from 'use-debounce';

export default function SearchInput({inputRef, value, onChange, onSelect}) {
  const [focus, setFocus] = useState(false);
  const [features, setFeatures] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [debounced] = useDebounce(value, 500);

  useEffect(() => {
    if (debounced) {
      const query = encodeURIComponent(debounced);
      const params = querystring.stringify({
        access_token: process.env.GATSBY_MAPBOX_ACCESS_TOKEN,
        types: ['district', 'place', 'locality', 'neighborhood']
      });

      fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?${params}`
      )
        .then(response => response.json())
        .then(data => {
          setFeatures(data.features);
          setSelectedIndex(0);
        });
    } else {
      setFeatures([]);
    }
  }, [debounced]);

  function handleKeyDown({key}) {
    switch (key) {
      case 'Escape':
        onChange('');
        break;
      case 'Enter':
        if (Number.isInteger(selectedIndex)) {
          onSelect(features[selectedIndex]);
        }
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        setSelectedIndex(prevSelectedIndex => {
          const direction = key === 'ArrowUp' ? -1 : 1;
          return Number.isInteger(prevSelectedIndex)
            ? Math.max(
                0,
                Math.min(features.length - 1, prevSelectedIndex + direction)
              )
            : 0;
        });
        break;
      default:
    }
  }

  return (
    <Box w="300px" position="relative">
      <chakra.input
        w="full"
        px="6"
        h="12"
        borderRadius="xl"
        bg="gray.50"
        _focus={{
          bgImage: 'linear-gradient(transparent, white)',
          boxShadow: 'xl'
        }}
        fontSize="lg"
        outline="none"
        placeholder="Search for a location"
        ref={inputRef}
        onFocus={() => {
          setFocus(true);
          setSelectedIndex(0);
        }}
        onBlur={() => setFocus(false)}
        onKeyDown={handleKeyDown}
        value={value}
        onChange={event => onChange(event.target.value)}
      />
      {focus && value && features.length > 0 && (
        <List
          py="4"
          position="absolute"
          top="100%"
          left="0"
          mt="4"
          width="200%"
          bg="white"
          borderRadius="xl"
          boxShadow="xl"
          onMouseDown={event => event.preventDefault()}
        >
          {features.map((feature, index) => (
            <ListItem
              key={feature.id}
              px="6"
              py="2"
              lineHeight="short"
              onClick={() => onSelect(feature)}
              bg={index === selectedIndex && 'gray.50'}
              onMouseEnter={() => setSelectedIndex(index)}
              onMouseLeave={() => setSelectedIndex(null)}
            >
              <Text>{feature.text}</Text>
              {feature.context.length > 0 && (
                <Text fontSize="sm" color="gray.500">
                  {feature.context[0].text}
                </Text>
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}

SearchInput.propTypes = {
  onChange: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
  inputRef: PropTypes.object.isRequired
};
