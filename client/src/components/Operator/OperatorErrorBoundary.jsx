import React from 'react';

class OperatorErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, errorInfo) {
		// Có thể gửi log tới server tại đây nếu cần
		// console.error('[OperatorErrorBoundary]', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="operator-card" role="alert" aria-live="assertive">
					<div className="operator-card__header">
						<h2 className="operator-card__title">Đã xảy ra lỗi</h2>
					</div>
					<div className="operator-card__body">
						<p>Xin lỗi, đã có lỗi xảy ra khi hiển thị nội dung. Vui lòng tải lại trang hoặc thử lại sau.</p>
						{process.env.NODE_ENV !== 'production' && this.state.error && (
							<pre className="operator-code" style={{whiteSpace: 'pre-wrap', marginTop: '1rem'}}>
								{String(this.state.error?.message || this.state.error)}
							</pre>
						)}
						<div style={{marginTop: '1rem'}}>
							<button className="operator-btn operator-btn--primary" onClick={() => window.location.reload()}>
								Tải lại trang
							</button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default OperatorErrorBoundary;








