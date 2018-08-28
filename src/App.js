import React, { Component } from "react";
import he from "he";
import * as _ from "lodash";
import "tabler-react/dist/Tabler.css";
import { Page, Grid, Card, Container } from "tabler-react/dist";
import Waypoint from "react-waypoint";
import { apiBasePath, youtubeLinkPattern } from "./constants";

const getJson = _.partialRight(_.invoke, "json");

const getHnUrl = path => `https://news.ycombinator.com/${path}`;

export class App extends Component {
  state = {
    page: 1,
    loading: true,
    items: []
  };

  videoPosts = item =>
    _([item, ...item.comments.map(this.videoPosts)])
      .flatten()
      .map(it => ({
        ...it,
        title: it.type === "comment" ? item.title : it.title,
        content: he.decode(it.content)
      }))
      .filter(it => youtubeLinkPattern.test(it.content))
      .flatMap(it =>
        (it.content.match(youtubeLinkPattern) || []).map(videoUrl => ({
          ...it,
          videoId: videoUrl.match(new RegExp(youtubeLinkPattern, "i"))[1]
        }))
      )
      .uniqBy("videoId")
      .orderBy("time")
      .value();

  loadMore = () => !this.loading && this.loadPage(this.state.page + 1);

  loadPage = page => {
    this.setState({
      loading: true
    });

    fetch(`${apiBasePath}/news/${this.state.page}.json`)
      .then(getJson)
      .then((fetchedItems = []) => {
        fetchedItems.forEach(async item => {
          const videoItems = await this.fetchItem(item);
          if (videoItems.length) {
            this.setState(({ items }) => ({
              items: _.uniqBy([...items, ...videoItems], 'videoId'),
            }));
          }
        });
      })
      .then(() =>
        this.setState(({ page }) => ({
          page: Math.min(page + 1, 10)
        }))
      )
      .finally(() =>
        this.setState({
          loading: false
        })
      );
  };

  fetchItem({ id }) {
    return fetch(`${apiBasePath}/item/${id}.json`)
      .then(getJson)
      .then(this.videoPosts);
  }

  componentDidMount() {
    this.loadMore();
  }

  render() {
    return (
      <Page>
        <Page.Main>
          <Container className="text-center my-4">
            <h1>HackerTube</h1>
          </Container>
          <Container>
            {this.state.items.map(item => (
              <Grid.Row cards key={item.videoId}>
                <Grid.Col md={8} offsetMd={2} OffsetSm={0}>
                  <Card
                    title={
                      <a target="_blank" href={getHnUrl(item.url)}>
                        {item.title}
                      </a>
                    }
                  >
                    <Card.Body style={{ padding: 0 }}>
                      <iframe
                        type="text/html"
                        src={`https://youtube.com/embed/${item.videoId}`}
                        title={item.videoId}
                        width="100%"
                        height="320"
                        frameBorder="0"
                        allowFullScreen={true}
                      />
                    </Card.Body>
                  </Card>
                </Grid.Col>
              </Grid.Row>
            ))}
            <Waypoint bottomOffset={-80} onEnter={this.loadMore} />
          </Container>
        </Page.Main>
      </Page>
    );
  }
}
