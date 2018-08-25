import React, { Component } from 'react';
import he from 'he';
import * as _ from 'lodash';
import "tabler-react/dist/Tabler.css";
import { Page, Grid, Card, Container } from 'tabler-react/dist';

const newsUrl = 'https://api.hnpwa.com/v0/news'
const itemUrl = 'https://api.hnpwa.com/v0/item'

const pattern = /\b(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9]{11})\b/gim


export class App extends Component {
  state = {
    page: 7,
    items: [],
  }

  videoPosts = (item) =>
    _([item, ...item.comments.map(this.videoPosts)])
      .flatten()
      .map(it => ({
        ...it,
        title: it.type === 'comment' ? item.title : it.title,
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
      .orderBy('time')
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
      <Page>
      <Page.Title>HackerTube</Page.Title>
      <Page.Main>
      <Container>
      {
        this.state.items.map(item => (
          <Grid.Row cards gutters='md'>
          <Grid.Col width={6}>
          <Card
            key={item.videoId}
            title={item.title}
          >
            <Card.Body>
            <iframe
              type='text/html'
              src={`https://youtube.com/embed/${item.videoId}`}
              title={item.videoId}
              width='100%'
              height='320'
              frameBorder='0'
              allowfullscreen='allowfullscreen'
            >
            </iframe>
            </Card.Body>
          </Card>
          </Grid.Col>
          </Grid.Row>
        ))
      }
      </Container>
      </Page.Main>
      </Page>
    );
  }
}

