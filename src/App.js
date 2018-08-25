import React, { Component } from 'react';
import he from 'he';
import * as _ from 'lodash';
import "tabler-react/dist/Tabler.css";
import { Page, Grid, Card, Container, Loader, Progress } from 'tabler-react/dist';
import Waypoint from 'react-waypoint';

const baseUrl = 'https://api.hnpwa.com/v0'

const pattern = /\b(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9]{11})\b/gim

const getJson = _.partialRight(_.invoke, 'json');

const getHnUrl = (path) => `https://news.ycombinator.com/${path}`;

export class App extends Component {
  state = {
    page: 1,
    loading: true,
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

  loadMore = () => 
    !this.loading && this.loadPage(this.state.page + 1)

  loadPage = (page) => {
    this.setState({
      loading: true
    });

    fetch(`${baseUrl}/news/${this.state.page}.json`)
      .then(getJson)
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
      .then(() => this.setState(({ page }) => ({
        page: Math.min(page + 1, 10)
      })))
      .finally(() => this.setState({
        loading: false
      }));
  }

  fetchItem({ id }) {
    return fetch(`${baseUrl}/item/${id}.json`)
      .then(getJson)
      .then(this.videoPosts)
  }

  componentDidMount() {
    this.loadMore()
  }

  render() {
    return (
      <Page>
      <Page.Main>
      <Container className='text-center my-4'>
        <h1>HackerTube</h1>
      </Container>
      <Container>
      {
        this.state.items.map(item => (
          <Grid.Row cards key={item.videoId}>
          <Grid.Col md={8} offsetMd={2} OffsetSm={0}>
          <Card title={<a target="_blank" href={getHnUrl(item.url)}>{item.title}</a>}>
            <Card.Body style={{padding: 0}}>
            <iframe
              type='text/html'
              src={`https://youtube.com/embed/${item.videoId}`}
              title={item.videoId}
              width='100%'
              height='320'
              frameBorder='0'
              allowFullScreen={true}
            >
            </iframe>
            </Card.Body>
          </Card>
          </Grid.Col>
          </Grid.Row>
        ))
      }
      <Waypoint
        bottomOffset={-80}
        onEnter={this.loadMore} />
      </Container>
      </Page.Main>
      </Page>
    );
  }
}

