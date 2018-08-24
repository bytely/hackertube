import React, { Component } from 'react';
import he from 'he';
import * as _ from 'lodash';

/*
const url = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const itemUrl = 'https://hacker-news.firebaseio.com/v0/item';
*/
const newsUrl = 'https://api.hnpwa.com/v0/news'
const itemUrl = 'https://api.hnpwa.com/v0/item'

const pattern = /\b(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9]{11})\b/gi

export class App extends Component {
  state = {
    page: 1,
    videoUrls: [],
  }

  videoPosts = ({ content = '', comments = [] }) =>
    _([content]).concat(...comments.map(this.videoPosts))
      .map(he.decode)
      .flatMap(post => post.match(pattern))
      .compact()
      .uniq()
      .value()

  fetchItem({ id }) {
    return fetch(`${itemUrl}/${id}.json`)
      .then(res => res.json())
      .then(this.videoPosts)
  }

  componentDidMount() {
    fetch(`${newsUrl}/${this.state.page}.json`)
      .then(res => res.json())
      .then((items = []) => {
        items.forEach(async item => {
          const itemUrls = await this.fetchItem(item);
          if (itemUrls.length) {
            this.setState(({ videoUrls }) => ({
              videoUrls: [ ...videoUrls, ...itemUrls ]
            }));
          }
        })
      })
  }

  render() {
    const { videoUrls } = this.state;

    return (
      <div>
      {
        videoUrls.map(url => (
          <div key={url}>
            <iframe type='text/html' src={`https://${url}`} title={url} frameBorder='0'></iframe>
          </div>
        ))
      }
      </div>
    );
  }
}

