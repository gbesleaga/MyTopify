/*
 * This file is subject to the terms and conditions defined in
 * file 'LICENSE.txt', which is part of this source code package.
 */

import { Injectable } from '@angular/core';
import { AppKnowledgeBase, ArtistKnowledgeBase, TrackKnowledgeBase } from './types';
import { Observable, forkJoin } from 'rxjs';
import { 
  Category, Item, Artist, ImageURL, Track, Period,
  SpotifyPagingObject, 
  SpotifyHttpClientService, 
  SpotifyArtistObject, 
  SpotifyTrackObject,
  AuthService } from 'spotify-lib';

@Injectable({providedIn: 'root'})
export class KnowledgeManagerService {

  knowledgeBase: AppKnowledgeBase = new AppKnowledgeBase();

  private fetchingKnowledge: Observable<boolean>;

  constructor(private auth: AuthService,
              private spotifyHttpClient: SpotifyHttpClientService) {
  }

  getKnowledgeBase(): AppKnowledgeBase {
    return this.knowledgeBase;
  }

  getArtistsFromPeriod(period: Period) {
    return this.knowledgeBase.getArtistsFromPeriod(period);
  } 

  getTracksFromPeriod(period: Period) {
    return this.knowledgeBase.getTracksFromPeriod(period);
  }

  getDisplayablePeriod(period: Period) {
    switch (period) {
      case Period.ShortTerm:
        return 'last 4 weeks';
      case Period.MediumTerm:
        return 'last 6 months';
      case Period.LongTerm:
        return 'all time';
    }
  }

  fetchKnowledge(categories: Category[]): Observable<boolean> {
    const requests = [];
    const requestTypes: Category[] = [];

    for (const cat of categories) {
      if (this.knowledgeBase.hasKnowledge(cat)) {
        continue;
      }

      const request = this.spotifyHttpClient.getUserTop({
        accessToken: this.auth.getAccessToken(),
        category: cat
      });

      requests.push(request);
      requestTypes.push(cat);
    }

    this.fetchingKnowledge = new Observable((observer) => {
      if (requests.length === 0) {
        observer.next(true);
        return;
      }

      forkJoin(requests).subscribe(
        responseList => {
          for (let i = 0; i < responseList.length; ++i) {
            switch (requestTypes[i].type) {
              case Item.Artist:
                this.knowledgeBase.addArtistKnowledge(requestTypes[i].period, this.parseArtistRawData(responseList[i]));
                break;

              case Item.Track:
                this.knowledgeBase.addTrackKnowledge(requestTypes[i].period, this.parseTrackRawData(responseList[i]));
                break;
            }
          }

          observer.next(true);
        },
        err => {
          observer.next(false);
        }
      );
    });

    return this.fetchingKnowledge;
  }

  private parseArtistRawData(data: SpotifyPagingObject): ArtistKnowledgeBase {
    const parsedArtists: Artist[] = [];

    for (const item of data.items) {
      const artistItem = item as SpotifyArtistObject;

      const artistImages: ImageURL[] = [];

      for (const imageObj of artistItem.images) {
        artistImages.push({width: imageObj.width, height: imageObj.height, url: imageObj.url});
      }

      parsedArtists.push({id: artistItem.id, name: artistItem.name, images: artistImages});
    }

    return { period: undefined, size: parsedArtists.length, artists: parsedArtists };
  }

  private parseTrackRawData(data: SpotifyPagingObject): TrackKnowledgeBase {
    const parsedTracks: Track[] = [];

    for (const item of data.items) {
      const trackItem = item as SpotifyTrackObject;

      const trackArtists: string[] = [];

      for (const artistObj of trackItem.artists) {
        trackArtists.push(artistObj.name);
      }

      const albumImages: ImageURL[] = [];

      for (const imageObj of trackItem.album.images) {
        albumImages.push({width: imageObj.width, height: imageObj.height, url: imageObj.url});
      }

      parsedTracks.push({
        id: trackItem.id, 
        name: trackItem.name,
        artists: trackArtists,
        album: {id: trackItem.album.id, name: trackItem.album.name, images: albumImages},
        previewURL: trackItem.preview_url});
    }

    return { period: undefined, size: parsedTracks.length, tracks: parsedTracks };
  }
}
