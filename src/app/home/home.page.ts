import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, ViewChild} from '@angular/core';
import {CapacitorVideoPlayer} from 'capacitor-video-player';
import {interval} from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements AfterViewInit {
  @ViewChild('video') captureElement: ElementRef;

  mediaRecorder: any;
  videoPlayer: any;
  isRecording = false;
  videos = [];

  constructor(
    private changeDetector: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.videoPlayer = CapacitorVideoPlayer;
  }

  async record() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        echoCancellation: true
      },
      audio: true
    });

    this.captureElement.nativeElement.srcObject = stream;

    this.isRecording = true;

    const options = { mimeType: 'video/webm' };
    this.mediaRecorder = new MediaRecorder(stream, options);
    this.mediaRecorder.start();

    let currentDuration = 0;
    const chunks = [];

    this.mediaRecorder.onstart = async () => {
      const duration = interval(1000).subscribe(() => {
        currentDuration += 1000;
        if (currentDuration === 3000) {
          this.stop();
          duration.unsubscribe();
        }
      });
    };

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = async () => {
      const videoBuffer = new Blob(chunks, { type: 'video/webm' });
      const base64string = await this.blobToBase64(videoBuffer) as string;
      this.videos.push(base64string);
      this.changeDetector.detectChanges();
    };
  }

  async stop() {
    this.mediaRecorder.stop();
    this.mediaRecorder = null;
    this.captureElement.nativeElement.srcObject = null;
    this.isRecording = false;
  }

  async play(data: string) {
    const base64data = this.base64VideoUrl(data);

    await this.videoPlayer.initPlayer({
      url: base64data,
      mode: 'fullscreen',
      playerId: 'fullscreen',
      componentTag: 'app-home'
    });
  }

  blobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  base64VideoUrl = (data: string) => {
    const base64 = data.replace('data:video/webm;base64,', '');
    return `data:video/mp4;base64,${base64}`;
  };
}
