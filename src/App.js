import React, { Component } from 'react';
import he from 'he';
import * as _ from 'lodash';

/*
const url = 'https://hacker-news.firebaseio.com/v0/topstories.json';
const itemUrl = 'https://hacker-news.firebaseio.com/v0/item';
*/
const newsUrl = 'https://api.hnpwa.com/v0/news'
const itemUrl = 'https://api.hnpwa.com/v0/item'

const pattern = /\b(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9]{11})\b/gim


export class App extends Component {
  state = {
    page: 1,
    items: [],
  }

  videoPosts = (item) =>
    _([item, ...item.comments.map(this.videoPosts)])
      .flatten()
      .map(it => ({
        ...it,
        content: he.decode(it.content)
      }))
      .filter(it => pattern.test(it.content))
      .flatMap(it => 
        (it.content.match(pattern) || []).map(videoUrl => ({
          ...it,
          videoId: videoUrl.match(new RegExp(pattern, 'i'))[1]
        }))
      )
      .uniqBy('videoId')
      .value()

  fetchItem({ id }) {
    return fetch(`${itemUrl}/${id}.json`)
      .then(res => res.json())
      .then(this.videoPosts)
  }

  componentDidMount() {
    fetch(`${newsUrl}/${this.state.page}.json`)
      .then(res => res.json())
      .then((fetchedItems = []) => {
        fetchedItems.forEach(async item => {
          const videoItems = await this.fetchItem(item);
          if (videoItems.length) {
            this.setState(({ items }) => ({
              items: [...items, ...videoItems]
            }));
          }
        })
      })
  }

  render() {
    return (
      <div>
      {
        this.state.items.map(item => (
          <div key={item.id}>
            <iframe
              type='text/html'
              src={`https://youtube.com/embed/${item.videoId}`}
              title={item.videoId}
              frameBorder='0'
              allowfullscreen
            >
            </iframe>
          </div>
        ))
      }
      </div>
    );
  }
}

