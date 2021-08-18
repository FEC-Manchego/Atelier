import React from 'react';
import axios from 'axios';
import moment from 'moment';
 import Images from './images.jsx';
 import Stars from './stars.jsx';
 import helpers from './ReviewsHelperFunc.jsx';
 import RatingsBreakdown from './ratingsBreakdown.jsx';
import ReviewProductBreakdown from './reviewProductBreakdown.jsx';
import AddReview from './addReview.jsx';

class Reviews extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            //holds all reviews for productID. do not modify
            allReviews: [],
            //hold reviews that want to be shown, such as sorted
            reviewsToBeShown: [],
            currentReviewIndex: 0,
            //holds reviews div for what will be shown
            reviewsDiv: [],
            reviewsShownSoFar : [],
            moreReviewsButton: [],
            reviewDropdownSortDiv: [],
            avgRating: 0,
            //holds which rating we would like to see when it's clicked
            reviewsFilter: {
                5: false,
                4: false,
                3: false,
                2: false,
                1: false
            },
            //displays a message saying which filters are on
            filterMessage: [],
            productInfo:[]

        }
        this.getReviews = this.getReviews.bind(this);
        this.renderReviews = this.renderReviews.bind(this);
        this.postReview = this.postReview.bind(this);
        this.showMoreReviewsButton = this.showMoreReviewsButton.bind(this);
        this.showReviewDropdownSort = this.showReviewDropdownSort.bind(this);
        this.handleClickFilterReviews = this.handleClickFilterReviews.bind(this);
        this.grabReviewsForFilter = this.grabReviewsForFilter.bind(this);
        this.doWeDisplayAllReviews = this.doWeDisplayAllReviews.bind(this);
        this.generateFilterMessage = this.generateFilterMessage.bind(this);
        this.setProductInfo = this.setProductInfo.bind(this);

    }
    //
    setProductInfo(info){
        this.setState({productInfo: info}, ()=> {
            console.log('set product info', this.state)
        });
    }
    //loops through the reviewsFilter and generates a message for each 'true' value
    generateFilterMessage() {
        let reviewsFilter = this.state.reviewsFilter;
        let messageDiv = []
        for (let elem in reviewsFilter) {
            if (reviewsFilter[elem]) {
                messageDiv.unshift(<span>{elem + ' '}</span>)
            }
        }
        let totalMessageDiv = <div>Filter/s applied: {messageDiv}
        <div id='remove-filters'>
            <p onClick = {() => {
                console.log('remove all filters');
                this.setState({reviewsFilter: {
                    5: false,
                    4: false,
                    3: false,
                    2: false,
                    1: false
                }, filterMessage: []} );
                let allReview = this.state.allReviews;
                this.setState({reviewsToBeShown: allReview, reviewsShownSoFar: [], currentReviewIndex: 0}, () => {
                    //now we will render these reviews to be shown
                    this.renderReviews();
                })
            }}><u id='clickable-link'>Remove all filters</u>
            </p>
            </div>
        </div>
        this.setState({filterMessage: totalMessageDiv})

    }
    handleClickFilterReviews(rating) {
        let newFilterView = !this.state.reviewsFilter[rating];
        let prevState = this.state.reviewsFilter;
        prevState[rating] = newFilterView;
        //now if all the filters are false, display the normal review
        if (this.doWeDisplayAllReviews()) {
            let normalReviews = this.state.allReviews;
            this.setState({reviewsToBeShown: normalReviews, reviewsDiv: [],reviewsShownSoFar: [], currentReviewIndex: 0, filterMessage: []}, () => {
                this.renderReviews()
            });
            return;
        }

        this.setState({reviewsFilter: prevState}, () => {
            this.generateFilterMessage();
            //now we have a filter of which reviews we want to see
            //loop through all reviews and grab the reviews with 'true' in our reviewsFilter
            const filteredReviews = this.grabReviewsForFilter();
            this.setState({reviewsToBeShown: filteredReviews, reviewsShownSoFar: [], currentReviewIndex: 0}, () => {
                //now we will render these reviews to be shown
                this.renderReviews();
            })
        });

    }
    doWeDisplayAllReviews(){
        let display = true;
        for (let elem in this.state.reviewsFilter) {
            if (this.state.reviewsFilter[elem]) {
                display = false;
                break;
            }
        }

        return display;

    }
    grabReviewsForFilter() {
        const allReviews = this.state.allReviews;
        const listOfRatingsWeWanttoFilter = this.state.reviewsFilter;
        let reviewsFiltered = [];
        for (let elem in allReviews) {
            if (listOfRatingsWeWanttoFilter[allReviews[elem].rating]) {
                reviewsFiltered.push(allReviews[elem]);
            }
        }
        return reviewsFiltered;

    }

    //function to handle getting the reviews for the given product id
     getReviews(sort = 'relevant') {
           const productID = this.props.props.productId;
           //uncomment below for testing purpose only
        //    const productID = 28221;
          axios({
            method: 'post',
            url: '/reviews',
            //for testing purposes we use this default productID
            data: {productID, sortKind: sort}
        }).then(response => {
            //now take this and update reviews state
            this.setState({allReviews: response.data,reviewsToBeShown: response.data, reviewsShownSoFar: [], currentReviewIndex: 0}, () => {
                this.renderReviews();
            })

        })
    }
    //handle rendering the sort dropdown only if we have reviews to show
    showReviewDropdownSort() {
        if (this.state.reviewsToBeShown.length > 0) {
            let div = <select id="review-dropdown" onChange = {(e) => {
                e.preventDefault();
                const dropdownChoice = e.target.value.toString();
                //wipe the current reviews
                this.setState({reviewsToBeShown: [], reviewsDiv: []}, ()=> {
                    this.getReviews(dropdownChoice)
                })
            }}>
            <option value="relevant">relevant</option>
            <option value="helpful">helpful</option>
            <option value="newest">newest</option>

        </select>;
            this.setState({reviewDropdownSortDiv: div });
        }
    }
    //function to handle rendering the reviews div, given any array of reviews in 'reviewsToBeShown'
    renderReviews() {
        let reviews = this.state.reviewsToBeShown;

        let innerDiv = this.state.reviewsShownSoFar;
        if (reviews.length) {
            //helper func to generate 1 review
        let generateReview = review => {
            let paragraph = <div key={review.review_id}>
                <div id= 'review-heading'>
                <p className="review-summary">{review.summary}</p>
                <p id= 'review-username'>{review.reviewer_name}</p>
                <p>{moment(review.date).format('MMMM Do YYYY')}</p>
                </div>
               {review.rating}
                {review.body}
                <div><Images props= {review.photos}/></div>

                {helpers.generateHelpfulness(review.helpfulness, review.review_id)}
                <Stars rating = {review.rating} starKey = {review.review_id}/>

                {helpers.generateRecommend(review.recommend, )}
                {helpers.reviewResponse(review.response)}
                </div>;
          return paragraph;
        };
        //display only 2 at a time
        let index = this.state.currentReviewIndex;
        for(let i = 0; i < 2; i++) {
            //get current review
            let review = reviews[index];
            if (review) {
                innerDiv.push(generateReview(review));
                index ++;
            }
        }
        let outerDiv = <div id='reviews'>{innerDiv}</div>
        this.setState({currentReviewIndex: index, reviewsDiv: outerDiv}, () => {
         this.showMoreReviewsButton();
         this.showReviewDropdownSort();
        });

        }


    }
    //handles showing the 'more reviews' button
    showMoreReviewsButton() {
        //if our current index is less than the amount of reviews we have, we will keep displaying this button
        if (this.state.currentReviewIndex < this.state.reviewsToBeShown.length) {
            //create a button
            let button = <button onClick= {()=> {
                this.renderReviews();
            }}>More Reviews</button>
            this.setState({moreReviewsButton: button})
        } else {
            this.setState({moreReviewsButton: []})
        }

    }

    //handles posting review
    postReview() {
        axios({
            method: 'post',
            url: '/postreview',

        }).then(response => {
            //now take this and update reviews state
            this.setState({allReviews: response.data.results, reviewsToBeShown: response.data.results}, ()=> {
                this.renderReviews();
            })
        })
    }
    componentDidMount() {
       this.getReviews();

    }

    render() {
        if (this.state.allReviews.length > 0) {
            return (
                <div id = 'reviews'>
                    <h1>{`Ratings & Reviews`}</h1>
                    {this.state.filterMessage}
                    <div id ='breakdown-div'>
                    <RatingsBreakdown props = {this.state} getAvgRating = {this.props.avgRatingFunc} handleFilter = {this.handleClickFilterReviews} product = {this.props.props.productId} setProductInfo= {this.setProductInfo} getNumOfReviews = {this.props.getNumOfReviews}/>
                    </div>


                     <div id='reviews-scrollable'>
                         <p id='reviews-sorted-by-info'>{this.state.reviewsToBeShown.length} reviews, sorted by </p>
                    {this.state.reviewDropdownSortDiv}
                   <div id='reviewsList'> {this.state.reviewsDiv}</div>
                    {this.state.moreReviewsButton}
                    <AddReview productId={this.props.props.productId} productName = {this.props.props} productInfo = {this.state.productInfo}/>
                    </div>

                </div>
            )

        }
        return null;

    }
}
export default Reviews;
