import { Component } from 'react';

export default class KopdesBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) return (
      <main style={{ padding: '3rem', background: '#142622', color: '#fff', minHeight: '100vh' }}>
        <h1>KOPDES 3D gagal dimuat</h1>
        <p role="alert">Periksa dukungan WebGL dan koneksi, lalu coba lagi.</p>
        <button onClick={() => window.location.reload()}>Coba lagi</button>{' '}
        <a href="/games">Kembali ke daftar game</a>
      </main>
    );
    return this.props.children;
  }
}
